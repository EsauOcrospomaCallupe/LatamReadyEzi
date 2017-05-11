/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 nov 2014     LatamReady Consultor
 * File : LMRY_RetencionesPagoProvCLNT.js
 */
function onclick_event(){
	var idRegistro = nlapiGetRecordId();
	var recordVP = nlapiLookupField('vendorpayment',idRegistro, ['entity', 'exchangerate', 'total']);
	var totalVP = Math.abs(recordVP.total);
	var flagEsAgente = nlapiLookupField('vendor', recordVP.entity, 'custentity_lmry_es_agente_retencion');
	//if ((parseFloat(recordVP.exchangerate) * parseFloat(totalVP))>679 && (flagEsAgente!='T')){
	if ((flagEsAgente!='T')){	
		var createPOURL = nlapiResolveURL('SUITELET', 'customscript_lmry_retencionespagostlt', 'customdeploy_lmry_retencionespagostlt', false); 
			createPOURL += '&id=' + nlapiGetRecordId(); 
		newWindow = window.open(createPOURL);
	}else{
		alert('No se genera impresión de retención. No supera los S/. 700.00 o no es Agente de Retención.');
	}
}