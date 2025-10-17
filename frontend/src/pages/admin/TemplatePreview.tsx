import React, { useState } from "react";
import { PageHeader } from "../../components";
import { mockNDRData } from "../../data/ndrTestData";
import type { NDRTemplateData } from "../../types/ndrTemplate";
import "./TemplatePreview.css";

export const TemplatePreview: React.FC = () => {
  const [showNDR, setShowNDR] = useState(true);
  const [showCoupons, setShowCoupons] = useState(true);

  const data: NDRTemplateData = {
    ...mockNDRData,
    includeNdr: showNDR,
    includeCoupons: showCoupons,
  };

  return (
    <div>
      <PageHeader 
        title="Aperçu Template NDR"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Template" }
        ]}
        description="Prévisualisation fidèle du template Note de Règlement et Coupons"
        backButton={{ label: "Retour admin", href: "/admin" }}
      />

      <div className="template-preview-container">

        <div className="template-preview-controls">
          <button
            className={showNDR ? "active" : ""}
            onClick={() => setShowNDR(!showNDR)}
          >
            {showNDR ? "Masquer" : "Afficher"} Note de Règlement
          </button>
          <button
            className={showCoupons ? "active" : ""}
            onClick={() => setShowCoupons(!showCoupons)}
          >
            {showCoupons ? "Masquer" : "Afficher"} Coupons
          </button>
        </div>

        <div className="ndr-template">
          {data.includeNdr && (
            <div className="page ndr-page">
              {/* En-tête */}
              <header className="header">
                <div className="company-info">
                  <h1 className="company-name">SOLUTION COURS</h1>
                  <p className="company-details">
                    SARL au capital de 1 000€<br />
                    SIRET: 123 456 789 00012<br />
                    Code APE: 8559A
                  </p>
                </div>
                <div className="document-info">
                  <h2 className="document-title">NOTE DE RÈGLEMENT</h2>
                  <p className="document-number">N° {data.noteNumber}</p>
                  <p className="document-date">Date: {data.formattedDate}</p>
                </div>
              </header>

              {/* Informations client */}
              <section className="client-section">
                <div className="client-info">
                  <h3>Client:</h3>
                  <p className="client-name">{data.clientName}</p>
                  <p className="client-address">{data.clientAddress}</p>
                  <p className="client-department">Département: {data.department}</p>
                </div>
                <div className="payment-info">
                  <h3>Mode de règlement:</h3>
                  <p className="payment-method">{data.paymentMethodLabel}</p>
                </div>
              </section>

              {/* Prestations */}
              <section className="services-section">
                <h3>Prestations:</h3>
                <table className="services-table">
                  <thead>
                    <tr>
                      <th>Matière</th>
                      <th>Tarif unitaire (€/h)</th>
                      <th>Quantité (h)</th>
                      <th>Salaire professeur (€/h)</th>
                      <th>Total (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td>{subject.subjectName}</td>
                        <td className="number">{subject.hourlyRate}</td>
                        <td className="number">{subject.quantity}</td>
                        <td className="number">{subject.professorSalary}</td>
                        <td className="number">{subject.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Récapitulatif financier */}
              <section className="summary-section">
                <h3>Récapitulatif:</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Total heures:</span>
                    <span className="value">{data.totalQuantity} h</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Chiffre d'affaires:</span>
                    <span className="value">{data.totalRevenue} €</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Salaire à verser:</span>
                    <span className="value">{data.salaryToPay} €</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Charges à verser:</span>
                    <span className="value">{data.chargesToPay} €</span>
                  </div>
                  <div className="summary-item highlight">
                    <span className="label">Marge:</span>
                    <span className="value">{data.marginAmount} € ({data.marginPercentage}%)</span>
                  </div>
                </div>
              </section>

              {/* Échéancier */}
              {data.paymentSchedule && (
                <section className="schedule-section">
                  <h3>Échéancier de paiement:</h3>
                  <div className="schedule-info">
                    <p><strong>Mode:</strong> {data.paymentSchedule.paymentMethodLabel}</p>
                    <p><strong>Nombre d'échéances:</strong> {data.paymentSchedule.numberOfInstallments}</p>
                    <p><strong>Jour du mois:</strong> {data.paymentSchedule.dayOfMonth}</p>
                  </div>
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Échéance</th>
                        <th>Date</th>
                        <th>Montant (€)</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paymentSchedule.installments.map((installment, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{installment.formattedDate}</td>
                          <td className="number">{installment.amount}</td>
                          <td className={`status status-${installment.status}`}>{installment.statusLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Notes */}
              {data.notes && (
                <section className="notes-section">
                  <h3>Notes:</h3>
                  <p className="notes-text">{data.notes}</p>
                </section>
              )}

              {/* Attestations dynamiques basées sur les coupons */}
              {data.includeCoupons && (
                <div className="attestations-section">
                  {data.coupons.map((coupon, index) => (
                    <div key={index} className="attestation-box">
                      <div className="attestation-title">ATTESTATION D'UNE HEURE DE COURS</div>
                      <div className="attestation-content">
                        <p><strong>{data.studentNames}</strong></p>
                        <p><strong>N°</strong> {coupon.number} <strong>Émise le</strong> {data.formattedDate}</p>
                        <p><strong>Date</strong> ________________</p>
                        <p><strong>Signature de l'employeur :</strong></p>
                        <p><em>A remettre à l'enseignant</em></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pied de page */}
              <footer className="footer">
                <div className="signature-section">
                  <div className="signature-client">
                    <p>Signature du client:</p>
                    <div className="signature-box"></div>
                  </div>
                  <div className="signature-company">
                    <p>Solution Cours:</p>
                    <div className="signature-box"></div>
                  </div>
                </div>
                <div className="footer-info">
                  <p>Document généré le {data.generationDate}</p>
                </div>
              </footer>
            </div>
          )}

          {data.includeCoupons && (
            <div className="page coupons-page">
              <header className="header">
                <div className="company-info">
                  <h1 className="company-name">SOLUTION COURS</h1>
                </div>
                <div className="document-info">
                  <h2 className="document-title">BONS DE COURS</h2>
                  <p className="document-number">Série: {data.couponSeries.code}</p>
                  <p className="document-date">Date: {data.formattedDate}</p>
                </div>
              </header>

              <section className="coupons-info">
                <div className="client-info">
                  <h3>Client: {data.clientName}</h3>
                  <p>Département: {data.department}</p>
                </div>
                <div className="coupons-summary">
                  <h3>Résumé des coupons:</h3>
                  <p><strong>Total coupons:</strong> {data.totalCoupons}</p>
                  <p><strong>Série:</strong> {data.couponSeries.code}</p>
                  <p><strong>Plage:</strong> {data.couponSeries.startNumber} - {data.couponSeries.endNumber}</p>
                </div>
              </section>

              {/* Grille des coupons */}
              <section className="coupons-grid">
                {data.coupons.map((coupon, index) => (
                  <div key={index} className="coupon">
                    <div className="coupon-header">
                      <span className="coupon-number">BON N° {coupon.number}</span>
                      <span className="coupon-series">Série: {coupon.series}</span>
                    </div>
                    <div className="coupon-body">
                      <div className="coupon-field">
                        <label>Élève:</label>
                        <div className="coupon-line">{data.studentNames}</div>
                      </div>
                      <div className="coupon-field">
                        <label>Matière:</label>
                        <div className="coupon-line"></div>
                      </div>
                      <div className="coupon-field">
                        <label>Date:</label>
                        <div className="coupon-line"></div>
                      </div>
                      <div className="coupon-field">
                        <label>Durée:</label>
                        <div className="coupon-line"></div>
                      </div>
                      <div className="coupon-field">
                        <label>Professeur:</label>
                        <div className="coupon-line"></div>
                      </div>
                    </div>
                    <div className="coupon-footer">
                      <span className="coupon-signature">Signature élève: ________________</span>
                    </div>
                  </div>
                ))}
              </section>

              <footer className="footer">
                <div className="footer-info">
                  <p>Coupons générés le {data.generationDate}</p>
                </div>
              </footer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};