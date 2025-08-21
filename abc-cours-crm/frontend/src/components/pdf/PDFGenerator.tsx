import React, { useState, useEffect } from 'react';
import { Button } from '../button/Button';
import { settlementService, type SettlementNote } from '../../services/settlementService';

interface PDFGeneratorProps {
  settlementNote: SettlementNote;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ settlementNote }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPDFs, setGeneratedPDFs] = useState<Array<{
    id: string;
    fileName: string;
    type: 'ndr' | 'coupons' | 'both';
    fileSize: number;
    generatedAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger la liste des PDFs existants
  useEffect(() => {
    loadPDFs();
  }, [settlementNote._id]);

  const loadPDFs = async () => {
    try {
      setIsLoading(true);
      const response = await settlementService.listPDFs(settlementNote._id);
      setGeneratedPDFs(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des PDFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async (type: 'ndr' | 'coupons' | 'both') => {
    setIsGenerating(true);
    
    try {
      console.log('🚀 Génération PDF:', type, settlementNote._id);
      
      // Appel réel à l'API
      const result = await settlementService.generatePDF(settlementNote._id, type);
      
      console.log('✅ PDF généré avec succès:', result);
      
      // Recharger la liste des PDFs
      await loadPDFs();
      
      // Télécharger automatiquement le PDF généré
      await downloadPDF(result.data.pdfId);
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF. Vérifiez la console pour plus de détails.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (pdfId: string) => {
    try {
      console.log('⬇️ Téléchargement PDF:', pdfId);
      
      const blob = await settlementService.downloadPDF(settlementNote._id, pdfId);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NDR_${settlementNote._id.substring(0, 8)}_${pdfId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF téléchargé avec succès');
    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error);
      alert('Erreur lors du téléchargement du PDF.');
    }
  };

  const previewPDF = async (pdfId: string) => {
    try {
      console.log('👁️ Prévisualisation PDF:', pdfId);
      
      await settlementService.previewPDF(settlementNote._id, pdfId);
      
    } catch (error) {
      console.error('❌ Erreur prévisualisation PDF:', error);
      alert('Erreur lors de la prévisualisation du PDF.');
    }
  };

  const deletePDF = async (pdfId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce PDF ?')) {
      return;
    }

    try {
      console.log('🗑️ Suppression PDF:', pdfId);
      
      await settlementService.deletePDF(settlementNote._id, pdfId);
      
      // Recharger la liste des PDFs
      await loadPDFs();
      
      console.log('✅ PDF supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur suppression PDF:', error);
      alert('Erreur lors de la suppression du PDF.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Génération PDF</h3>
      
      <div className="space-y-6">
        {/* Boutons de génération */}
        <div className="flex gap-3 flex-wrap">
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleGeneratePDF('ndr')}
              disabled={isGenerating}
            >
              {isGenerating ? 'Génération...' : 'NDR seule'}
            </Button>
            <div className="text-xs text-gray-500 mt-1">Document de facturation uniquement</div>
          </div>
          
          {settlementNote.couponSeriesId && (
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleGeneratePDF('coupons')}
                disabled={isGenerating}
              >
                {isGenerating ? 'Génération...' : 'Coupons seuls'}
              </Button>
              <div className="text-xs text-gray-500 mt-1">Bons de cours à découper</div>
            </div>
          )}
          
          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGeneratePDF('both')}
              disabled={isGenerating || !settlementNote.couponSeriesId}
            >
              {isGenerating ? 'Génération...' : 'NDR + Coupons'}
            </Button>
            <div className="text-xs text-gray-500 mt-1">Document complet avec tout</div>
          </div>
        </div>

        {/* Liste des PDFs existants */}
        <div>
          <h4 className="text-md font-medium mb-3">PDFs générés ({generatedPDFs.length})</h4>
          
          {isLoading ? (
            <div className="text-gray-500 text-sm">Chargement des PDFs...</div>
          ) : generatedPDFs.length === 0 ? (
            <div className="text-gray-500 text-sm italic">Aucun PDF généré pour cette note</div>
          ) : (
            <div className="space-y-2">
              {generatedPDFs.map((pdf) => (
                <div key={pdf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pdf.fileName}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pdf.type === 'ndr' ? 'bg-blue-100 text-blue-800' :
                        pdf.type === 'coupons' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {pdf.type === 'ndr' ? 'NDR' : pdf.type === 'coupons' ? 'Coupons' : 'Complet'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(pdf.fileSize / 1024).toFixed(1)} KB • {new Date(pdf.generatedAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => previewPDF(pdf.id)}
                    >
                      👁️
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadPDF(pdf.id)}
                    >
                      ⬇️
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => deletePDF(pdf.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};