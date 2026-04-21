import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { Alert } from 'react-native';

export const imprimerOrdonnancePDF = async (patient: any, consultation: any) => {
  try {
    const htmlContent = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1 style="text-align: center; color: #2c3e50;">ORDONNANCE MÉDICALE</h1>
        <hr />
        <p><strong>Patient :</strong> ${patient.prenom} ${patient.nom}</p>
        <p><strong>Date :</strong> ${consultation.date_cons}</p>
        <br />
        <h2 style="color: #00BFA5;">Prescriptions :</h2>
        <p style="font-size: 18px; line-height: 1.6;">${consultation.medicaments || "Aucun médicament prescrit"}</p>
        <br /><br />
        <p style="text-align: right;"><strong>Signature du Médecin</strong></p>
      </div>
    `;

    const options = {
      html: htmlContent,
      fileName: `Ordonnance_${patient.nom}_${Date.now()}`, // Ajout d'un ID unique pour éviter les conflits de fichiers
      
    };

    // Génération du fichier (On utilise 'any' pour éviter l'erreur de type sur convert)
    const file = await (RNHTMLtoPDF as any).convert(options);

    if (file && file.filePath) {
      // Ouverture du menu natif pour visualiser ou envoyer le PDF
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        title: "Ordonnance Patient",
        failOnCancel: false,
      });
    }
  } catch (error) {
    console.error("Erreur PDF:", error);
    Alert.alert("Erreur", "Impossible de générer le document PDF.");
  }
};