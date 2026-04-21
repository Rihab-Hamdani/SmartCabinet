import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import {retirerQuantite} from '../../database/stockService';
import type {StockItem} from '../../database/stockService';

export default function StockRetirer({navigation, route}: any) {
  const produit: StockItem = route?.params?.produit;
  const [quantite, setQuantite] = useState('');
  const [saving, setSaving]     = useState(false);

  if (!produit) {
    return (
      <View style={[styles.container,
        {justifyContent:'center', alignItems:'center'}]}>
        <Text style={{color:'#8B949E'}}>Produit introuvable</Text>
      </View>
    );
  }

  const enAlerte     = produit.quantite <= produit.seuil_alerte;
  const qNum         = parseInt(quantite);
  const apresRetrait = produit.quantite - (isNaN(qNum) ? 0 : qNum);
  const showPreview  = quantite !== '' && !isNaN(qNum) && qNum > 0;
  const isDisabled   = !quantite || isNaN(qNum) || qNum <= 0 ||
                       qNum > produit.quantite || saving;

  const handleRetirer = async () => {
    const q = parseInt(quantite);
    if (!quantite || isNaN(q) || q <= 0) {
      Alert.alert('Erreur', 'Entrez une quantité valide (> 0)');
      return;
    }
    if (q > produit.quantite) {
      Alert.alert(
        'Stock insuffisant',
        `Stock disponible : ${produit.quantite} ${produit.unite}`
      );
      return;
    }
    Alert.alert(
      'Confirmer le retrait',
      `Retirer ${q} ${produit.unite} de "${produit.nom}" ?\n\n` +
      `Stock actuel : ${produit.quantite}\n` +
      `Après retrait : ${produit.quantite - q}`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Confirmer',
          onPress: async () => {
            setSaving(true);
            try {
              const result = await retirerQuantite(produit.id, q);
              const msg = result.newQuantite <= produit.seuil_alerte
                ? `⚠️ Stock en alerte : ${result.newQuantite} ${produit.unite} restant(s)`
                : `✅ Nouveau stock : ${result.newQuantite} ${produit.unite}`;
              Alert.alert('Retrait effectué', msg, [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (e: any) {
              Alert.alert('Erreur', 'Une erreur est survenue. Réessayez.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>➖ Retirer du stock</Text>
        <View style={{width:70}} />
      </View>

      <View style={styles.content}>

        <View style={[styles.produitCard, enAlerte && styles.produitCardAlerte]}>
          <Text style={styles.produitNom}>{produit.nom}</Text>
          <View style={styles.produitRow}>
            <View>
              <Text style={styles.produitStockLabel}>Stock actuel</Text>
              <Text style={[styles.produitStock,
                enAlerte && {color:'#FF4757'}]}>
                {produit.quantite}{' '}
                <Text style={styles.produitUnite}>{produit.unite}</Text>
              </Text>
            </View>
            <View style={styles.seuilBox}>
              <Text style={styles.seuilLabel}>Seuil alerte</Text>
              <Text style={styles.seuilVal}>
                {produit.seuil_alerte} {produit.unite}
              </Text>
            </View>
          </View>
          {enAlerte && (
            <View style={styles.alerteBar}>
              <Text style={styles.alerteBarTxt}>
                ⚠️ Ce produit est déjà en alerte de stock
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.inputLabel}>Quantité à retirer</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.quantiteInput}
            value={quantite}
            onChangeText={setQuantite}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#484F58"
            autoFocus
          />
          <Text style={styles.uniteLabel}>{produit.unite}</Text>
        </View>

        {showPreview && (
          <View style={[
            styles.preview,
            apresRetrait < 0 ? styles.previewError :
            apresRetrait <= produit.seuil_alerte ? styles.previewWarn :
            styles.previewOk,
          ]}>
            {apresRetrait < 0 ? (
              <Text style={styles.previewTxt}>
                ❌ Stock insuffisant (manque {Math.abs(apresRetrait)} {produit.unite})
              </Text>
            ) : apresRetrait <= produit.seuil_alerte ? (
              <Text style={styles.previewTxt}>
                ⚠️ Après retrait : {apresRetrait} {produit.unite} → alerte activée
              </Text>
            ) : (
              <Text style={styles.previewTxt}>
                ✅ Après retrait : {apresRetrait} {produit.unite}
              </Text>
            )}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTxt}>
            ℹ️ En tant que médecin, vous pouvez retirer des quantités.
            La gestion complète est réservée à la secrétaire.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.retirerBtn, isDisabled && styles.retirerBtnDisabled]}
          onPress={handleRetirer}
          disabled={isDisabled}>
          <Text style={styles.retirerBtnTxt}>
            {saving ? '⏳ Traitement...' : '➖ Confirmer le retrait'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnTxt}>Annuler</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:          {flex:1, backgroundColor:'#0D1117'},
  header:             {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:50, backgroundColor:'#161B22', borderBottomWidth:1, borderBottomColor:'#30363D'},
  back:               {color:'#00BFA5', fontSize:14, fontWeight:'600', width:70},
  headerTitle:        {fontSize:17, fontWeight:'700', color:'#E6EDF3'},
  content:            {flex:1, padding:16},
  produitCard:        {backgroundColor:'#161B22', borderRadius:14, padding:16, marginBottom:20, borderWidth:1, borderColor:'#30363D'},
  produitCardAlerte:  {borderLeftWidth:4, borderLeftColor:'#FF4757'},
  produitNom:         {fontSize:18, fontWeight:'700', color:'#E6EDF3', marginBottom:12},
  produitRow:         {flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end'},
  produitStockLabel:  {fontSize:12, color:'#8B949E', marginBottom:4},
  produitStock:       {fontSize:36, fontWeight:'800', color:'#E6EDF3'},
  produitUnite:       {fontSize:16, color:'#8B949E', fontWeight:'400'},
  seuilBox:           {alignItems:'flex-end'},
  seuilLabel:         {fontSize:12, color:'#8B949E'},
  seuilVal:           {fontSize:14, color:'#8B949E', fontWeight:'600'},
  alerteBar:          {backgroundColor:'rgba(255,71,87,0.1)', borderRadius:8, padding:8, marginTop:12},
  alerteBarTxt:       {color:'#FF4757', fontSize:13, fontWeight:'600'},
  inputLabel:         {fontSize:13, fontWeight:'600', color:'#8B949E', marginBottom:10},
  inputRow:           {flexDirection:'row', alignItems:'center', marginBottom:16},
  quantiteInput:      {flex:1, backgroundColor:'#161B22', borderRadius:12, borderWidth:2, borderColor:'#00BFA5', padding:14, fontSize:28, fontWeight:'800', color:'#E6EDF3', textAlign:'center'},
  uniteLabel:         {fontSize:16, color:'#8B949E', fontWeight:'600', marginLeft:12},
  preview:            {borderRadius:10, padding:12, marginBottom:16},
  previewOk:          {backgroundColor:'rgba(0,191,165,0.1)', borderWidth:1, borderColor:'rgba(0,191,165,0.3)'},
  previewWarn:        {backgroundColor:'rgba(255,165,2,0.1)', borderWidth:1, borderColor:'rgba(255,165,2,0.3)'},
  previewError:       {backgroundColor:'rgba(255,71,87,0.1)', borderWidth:1, borderColor:'rgba(255,71,87,0.3)'},
  previewTxt:         {fontSize:14, fontWeight:'600', color:'#E6EDF3'},
  infoBox:            {backgroundColor:'rgba(0,191,165,0.07)', borderRadius:10, padding:12, marginBottom:20, borderWidth:1, borderColor:'rgba(0,191,165,0.15)'},
  infoTxt:            {fontSize:12, color:'#00BFA5', lineHeight:18},
  retirerBtn:         {backgroundColor:'#FFA502', borderRadius:12, padding:16, alignItems:'center'},
  retirerBtnDisabled: {opacity:0.4},
  retirerBtnTxt:      {color:'#000', fontSize:16, fontWeight:'800'},
  cancelBtn:          {padding:14, alignItems:'center'},
  cancelBtnTxt:       {color:'#484F58', fontSize:15},
});