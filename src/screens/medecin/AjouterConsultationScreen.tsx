import React, { useState } from 'react';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  enregistrerConsultation,
  MedicamentPrescrit,
} from '../../database/rdvService';

const AjouterConsultationScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { patientId, patientNom } = route.params;

  // États pour la consultation
  const [diagnostic, setDiagnostic] = useState('');
  const [symptomes, setSymptomes] = useState('');
  const [remarquesMedecin, setRemarquesMedecin] = useState('');

  // États pour l'ajout de médicaments
  const [medicaments, setMedicaments] = useState<MedicamentPrescrit[]>([]);
  const [nomMed, setNomMed] = useState('');
  const [posologie, setPosologie] = useState('');
  const [conseil, setConseil] = useState('');

  // Ajouter un médicament à la liste locale (avant sauvegarde)
  const ajouterMedicamentALaListe = () => {
    if (!nomMed || !posologie) {
      Alert.alert('Erreur', 'Le nom et la posologie sont requis.');
      return;
    }
    const nouveau = {
      nom_medicament: nomMed,
      posologie,
      remarques_medicament: conseil,
    };
    setMedicaments([...medicaments, nouveau]);
    // Reset les champs
    setNomMed('');
    setPosologie('');
    setConseil('');
  };

  // Fonction pour générer le PDF
  const genererOrdonnancePDF = async (meds: MedicamentPrescrit[]) => {
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <div style="text-align: center; border-bottom: 2px solid #00BFA5;">
              <h1>Dr. BEN FLEN</h1>
              <p>Spécialité : Cardiologue</p>
            </div>
            <div style="margin-top: 20px;">
              <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Patient :</strong> ${patientNom}</p>
            </div>
            <h2 style="text-align: center; margin-top: 40px;">ORDONNANCE</h2>
            <div style="margin-top: 20px;">
              ${meds
                .map(
                  m => `
                <div style="margin-bottom: 15px;">
                  <p><strong>• ${m.nom_medicament}</strong> : ${m.posologie}</p>
                  ${
                    m.remarques_medicament
                      ? `<p style="margin-left: 20px; font-style: italic;">Note : ${m.remarques_medicament}</p>`
                      : ''
                  }
                </div>
              `,
                )
                .join('')}
            </div>
            <div style="margin-top: 100px; text-align: right;">
              <p>Signature et Cachet</p>
            </div>
          </body>
        </html>
      `;

      const options = {
        html: html,
        fileName: `Ordonnance_${patientNom.replace(/\s/g, '_')}`,
        directory: 'Documents',
      };

      const file = await (RNHTMLtoPDF as any).convert(options);

      if (file.filePath) {
        await Share.open({
          url: `file://${file.filePath}`,
          type: 'application/pdf',
          title: "Partager l'ordonnance",
          failOnCancel: false,
        });
      }
    } catch (error) {
      console.error('Erreur PDF:', error);
      Alert.alert('Erreur', 'Impossible de générer le PDF sur ce téléphone.');
    }
  };
  const handleFinaliser = async () => {
    if (medicaments.length === 0) {
      Alert.alert('Attention', 'Veuillez ajouter au moins un médicament.');
      return;
    }

    try {
      // 1. Sauvegarde en Base de données
      await enregistrerConsultation(
        patientId,
        symptomes,
        remarquesMedecin,
        medicaments,
      );

      // 2. Proposer le PDF
      Alert.alert('Succès', 'Consultation enregistrée avec succès !', [
        {
          text: 'Générer Ordonnance',
          onPress: async () => {
            await genererOrdonnancePDF(medicaments);
            navigation.goBack(); // On rentre après le PDF
          },
        },
        {
          text: 'Quitter',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🩺 Nouvelle Consultation</Text>
        <Text style={styles.patientName}>Patient : {patientNom}</Text>

        {/* Section Diagnostic */}
        <View style={styles.section}>
          <Text style={styles.label}>Diagnostic final</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Grippe, Angine, etc."
            placeholderTextColor="#484F58"
            value={diagnostic}
            onChangeText={setDiagnostic}
            multiline
          />
          <Text style={styles.label}>Symptômes</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Ex: Fièvre, toux..."
            placeholderTextColor="#484F58"
            value={symptomes}
            onChangeText={setSymptomes}
          />

          <Text style={styles.label}>Remarques Médecin</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Notes privées..."
            placeholderTextColor="#484F58"
            value={remarquesMedecin}
            onChangeText={setRemarquesMedecin}
          />
        </View>

        {/* Section Ordonnance */}
        <View style={styles.section}>
          <Text style={styles.titleSection}>💊 Prescription</Text>
          <TextInput
            style={styles.smallInput}
            placeholder="Nom du médicament"
            placeholderTextColor="#484F58"
            value={nomMed}
            onChangeText={setNomMed}
          />
          <TextInput
            style={styles.smallInput}
            placeholder="Posologie (ex: 1 mat/soir)"
            placeholderTextColor="#484F58"
            value={posologie}
            onChangeText={setPosologie}
          />
          <TextInput
            style={styles.smallInput}
            placeholder="Conseils (ex: sans sel, après repas)"
            placeholderTextColor="#484F58"
            value={conseil}
            onChangeText={setConseil}
          />
          <TouchableOpacity
            style={styles.btnAddMed}
            onPress={ajouterMedicamentALaListe}
          >
            <Text style={styles.btnAddMedText}>+ Ajouter à l'ordonnance</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des médicaments ajoutés */}
        {medicaments.map((item, index) => (
          <View key={index} style={styles.medItem}>
            <Text style={{ color: '#E6EDF3' }}>
              {item.nom_medicament} - {item.posologie}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setMedicaments(medicaments.filter((_, i) => i !== index))
              }
            >
              <Text style={{ color: '#F85149' }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.btnFinaliser} onPress={handleFinaliser}>
          <Text style={styles.btnFinaliserText}>Enregistrer et Créer PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scroll: { padding: 20, paddingTop: 50 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E6EDF3',
    marginBottom: 5,
  },
  patientName: { fontSize: 16, color: '#00BFA5', marginBottom: 20 },
  section: {
    backgroundColor: '#161B22',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  titleSection: {
    color: '#E6EDF3',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  label: { color: '#8B949E', marginBottom: 5, fontSize: 14 },
  input: {
    backgroundColor: '#0D1117',
    color: '#E6EDF3',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlignVertical: 'top',
    height: 80,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  smallInput: {
    backgroundColor: '#0D1117',
    color: '#E6EDF3',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  btnAddMed: {
    backgroundColor: '#30363D',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  btnAddMedText: { color: '#58A6FF', fontWeight: 'bold' },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  btnFinaliser: {
    backgroundColor: '#238636',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  btnFinaliserText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default AjouterConsultationScreen;
