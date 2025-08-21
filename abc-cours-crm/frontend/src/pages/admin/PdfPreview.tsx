import React, { useState, useEffect } from 'react';

const PdfPreview: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplateHtml();
  }, []);

  const loadTemplateHtml = async () => {
    try {
      const response = await fetch('/api/template-html', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du template');
      }

      const html = await response.text();
      setHtmlContent(html);
    } catch (error) {
      console.error('Erreur:', error);
      setHtmlContent('<div style="color: red; text-align: center; padding: 50px;">Erreur lors du chargement du template</div>');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Pas d'affichage pendant le chargement
  }

  // Afficher uniquement le HTML du template avec les vraies données
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default PdfPreview;