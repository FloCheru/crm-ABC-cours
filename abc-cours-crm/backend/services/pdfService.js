const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;

class PDFService {
  constructor() {
    this.templatePath = path.join(__dirname, "../templates/paymentNote.html");
    this.cssPath = path.join(__dirname, "../templates/paymentNote.css");
  }

  async generatePaymentNotePDF(paymentNote, couponSeries) {
    try {
      // Lire le template HTML et CSS
      const htmlTemplate = await fs.readFile(this.templatePath, "utf8");
      const cssStyles = await fs.readFile(this.cssPath, "utf8");

      // Générer le numéro de note
      const noteNumber = this.generateNoteNumber(paymentNote.entryDate);

      // Préparer les données pour le template
      const templateData = this.prepareTemplateData(
        paymentNote,
        couponSeries,
        noteNumber
      );

      // Remplir le template avec les données
      const filledHTML = this.fillTemplate(
        htmlTemplate,
        templateData,
        cssStyles
      );

      // Générer le PDF avec Puppeteer
      const pdfBuffer = await this.generatePDF(filledHTML);

      return {
        buffer: pdfBuffer,
        filename: `note_reglement_${noteNumber}.pdf`,
        noteNumber: noteNumber,
      };
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      throw new Error("Erreur lors de la génération du PDF");
    }
  }

  generateNoteNumber(entryDate) {
    const date = new Date(entryDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${year}-${month}-${random}`;
  }

  prepareTemplateData(paymentNote, couponSeries, noteNumber) {
    const entryDate = new Date(paymentNote.entryDate);
    const formattedDate = entryDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Calculer le montant total
    const totalAmount = paymentNote.amount;
    const unitPrice = couponSeries.hourlyRate;
    const totalHours = Math.round((totalAmount / unitPrice) * 100) / 100;

    // Générer l'échéancier (10 échéances mensuelles)
    const installmentAmount = Math.round((totalAmount / 10) * 100) / 100;
    const installments = [];

    for (let i = 0; i < 10; i++) {
      const installmentDate = new Date(entryDate);
      installmentDate.setMonth(installmentDate.getMonth() + i + 1);
      installments.push({
        date: installmentDate.toLocaleDateString("fr-FR"),
        amount: installmentAmount,
        paymentMethod: this.getPaymentMethodLabel(paymentNote.paymentMethod),
      });
    }

    // Répartition URSSAF/Client (50/50)
    const clientAmount = Math.round((totalAmount / 2) * 100) / 100;
    const urssafAmount = totalAmount - clientAmount;

    return {
      noteNumber: noteNumber,
      issueDate: formattedDate,
      clientName: paymentNote.family.name,
      clientAddress: this.formatAddress(paymentNote.family),
      clientAccount: this.generateClientAccount(paymentNote.family._id),
      studentName: `${paymentNote.student.firstName} ${paymentNote.student.lastName}`,
      unitPrice: unitPrice.toFixed(2),
      totalHours: totalHours,
      totalAmount: totalAmount.toFixed(2),
      subject: paymentNote.subject.name,
      studentLevel: this.getLevelLabel(paymentNote.studentLevel),
      installments: installments,
      clientAmount: clientAmount.toFixed(2),
      urssafAmount: urssafAmount.toFixed(2),
      paymentMethod: this.getPaymentMethodLabel(paymentNote.paymentMethod),
      paymentReference: paymentNote.paymentReference || "",
      notes: paymentNote.notes || "",
      // Générer les numéros de coupons
      coupons: this.generateCouponNumbers(
        couponSeries.totalCoupons,
        noteNumber
      ),
    };
  }

  formatAddress(family) {
    if (family.address) {
      return `${family.address.street}, ${family.address.postalCode} ${family.address.city}`;
    }
    return "Adresse non renseignée";
  }

  generateClientAccount(familyId) {
    // Générer un numéro de compte basé sur l'ID de la famille
    return familyId.toString().slice(-8).padStart(8, "0");
  }

  getLevelLabel(level) {
    const levels = {
      primaire: "Primaire",
      collège: "Collège",
      lycée: "Lycée",
      supérieur: "Supérieur",
    };
    return levels[level] || level;
  }

  getPaymentMethodLabel(method) {
    const methods = {
      check: "Chèque",
      transfer: "Virement",
      card: "Carte bancaire",
      cash: "Espèces",
      prlv: "Prélèvement",
    };
    return methods[method] || method;
  }

  generateCouponNumbers(totalCoupons, noteNumber) {
    const coupons = [];
    for (let i = 1; i <= totalCoupons; i++) {
      const couponNumber = `${noteNumber}-${String(i).padStart(3, "0")}`;
      coupons.push({
        number: couponNumber,
        id: this.generateCouponId(),
      });
    }
    return coupons;
  }

  generateCouponId() {
    return Math.random().toString(36).substring(2, 10);
  }

  fillTemplate(htmlTemplate, data, cssStyles) {
    let filledHTML = htmlTemplate;

    // Remplacer les variables dans le template
    filledHTML = filledHTML.replace(/\{\{noteNumber\}\}/g, data.noteNumber);
    filledHTML = filledHTML.replace(/\{\{issueDate\}\}/g, data.issueDate);
    filledHTML = filledHTML.replace(/\{\{clientName\}\}/g, data.clientName);
    filledHTML = filledHTML.replace(
      /\{\{clientAddress\}\}/g,
      data.clientAddress
    );
    filledHTML = filledHTML.replace(
      /\{\{clientAccount\}\}/g,
      data.clientAccount
    );
    filledHTML = filledHTML.replace(/\{\{studentName\}\}/g, data.studentName);
    filledHTML = filledHTML.replace(/\{\{unitPrice\}\}/g, data.unitPrice);
    filledHTML = filledHTML.replace(/\{\{totalHours\}\}/g, data.totalHours);
    filledHTML = filledHTML.replace(/\{\{totalAmount\}\}/g, data.totalAmount);
    filledHTML = filledHTML.replace(/\{\{subject\}\}/g, data.subject);
    filledHTML = filledHTML.replace(/\{\{studentLevel\}\}/g, data.studentLevel);
    filledHTML = filledHTML.replace(/\{\{clientAmount\}\}/g, data.clientAmount);
    filledHTML = filledHTML.replace(/\{\{urssafAmount\}\}/g, data.urssafAmount);
    filledHTML = filledHTML.replace(
      /\{\{paymentMethod\}\}/g,
      data.paymentMethod
    );
    filledHTML = filledHTML.replace(
      /\{\{paymentReference\}\}/g,
      data.paymentReference
    );
    filledHTML = filledHTML.replace(/\{\{notes\}\}/g, data.notes);

    // Remplacer l'échéancier
    const installmentsHTML = data.installments
      .map(
        (installment) => `
      <tr>
        <td>${installment.date}</td>
        <td>${installment.amount.toFixed(2)} €</td>
        <td>${installment.paymentMethod}</td>
      </tr>
    `
      )
      .join("");
    filledHTML = filledHTML.replace(/\{\{installments\}\}/g, installmentsHTML);

    // Remplacer les coupons
    const couponsHTML = data.coupons
      .map(
        (coupon) => `
      <div class="coupon">
        <h4>ATTESTATION D'UNE HEURE DE COURS</h4>
        <p><strong>Élève:</strong> ${data.studentName}</p>
        <p><strong>N°:</strong> ${coupon.id}</p>
        <p><strong>Émis le:</strong> ${data.issueDate}</p>
        <div class="coupon-fields">
          <p><strong>Date:</strong> _________________</p>
          <p><strong>Signature de l'employeur:</strong> _________________</p>
          <p><em>A remettre à l'enseignant</em></p>
        </div>
      </div>
    `
      )
      .join("");
    filledHTML = filledHTML.replace(/\{\{coupons\}\}/g, couponsHTML);

    // Gérer les conditions pour paymentReference et notes
    filledHTML = filledHTML.replace(
      /\{\{#if paymentReference\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, content) => {
        return data.paymentReference ? content : "";
      }
    );

    filledHTML = filledHTML.replace(
      /\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, content) => {
        return data.notes ? content : "";
      }
    );

    // Injecter les styles CSS
    filledHTML = filledHTML.replace(
      /\/\* Les styles CSS seront injectés dynamiquement \*\//g,
      cssStyles
    );

    return filledHTML;
  }

  async generatePDF(htmlContent) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Définir le contenu HTML
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
      });

      // Générer le PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
        printBackground: true,
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

module.exports = new PDFService();
