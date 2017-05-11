/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Dec 2016     Ezi
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
var objContext = nlapiGetContext();
var nameScript = "LMRY_FactElectronicaGR_PE_CLNT"

function lmryFactElectInitPageCLNT(){
	/*
	var newDate = new Date();
	nlapiSetFieldValue('custpage_datefrom_filter_elect',  nlapiDateToString(newDate));
	nlapiSetFieldValue('custpage_dateto_filter_elect', nlapiDateToString(newDate));
	*/
	return true;
}
function lmryFactElectSaveRecordCLNT(){
	var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
	if (featuresubs == true || featuresubs == 'T'){
		var paramSubsidiaria	= nlapiGetFieldValue('custpage_subsidiary_filter_elect');
	}
	var paramDateFrom 	= nlapiGetFieldValue('custpage_datefrom_filter_elect');
	var paramDateTo		= nlapiGetFieldValue('custpage_dateto_filter_elect');
	var paramEntity		= nlapiGetFieldValue('custpage_entity_filter_elect');
	var paramFactura 	= nlapiGetFieldValue('custpage_factura_filter_elect');

	var busquedaTransacciones = nlapiLoadSearch('transaction', 'customsearch_lmry_info_gr_fact_elect_pe');

	if ((featuresubs == true || featuresubs == 'T') && paramSubsidiaria!='' && paramSubsidiaria!='null' && paramSubsidiaria!=null){
			busquedaTransacciones.addFilter(new nlobjSearchFilter('subsidiary', null, 'anyof', paramSubsidiaria));
	}
	if(paramEntity!='' && paramEntity!='null' && paramEntity!=null){
		busquedaTransacciones.addFilter(new nlobjSearchFilter('entity', null, 'anyof', paramEntity));
	}
	if(paramDateFrom!='' && paramDateFrom!='null' && paramDateFrom!=null){
		busquedaTransacciones.addFilter(new nlobjSearchFilter('trandate', null, 'onorafter', paramDateFrom));
	}
	if(paramDateTo!='' && paramDateTo!='null' && paramDateTo!=null){
		busquedaTransacciones.addFilter(new nlobjSearchFilter('trandate', null, 'onorbefore', paramDateTo));
	}
	if(paramFactura!='' && paramFactura!='null' && paramFactura!=null){
		busquedaTransacciones.addFilter(new nlobjSearchFilter('internalid', null, 'anyof', paramFactura));
	}
	nlapiLogExecution('ERROR', 'CLNT SCRIPT', 'paramFactura: '+paramFactura);

	busquedaTransacciones.addFilter(new nlobjSearchFilter('custbody_lmry_pe_identificador_comfiar', null, 'isempty', null));
	
	var intMinTransacciones = 0;
	var intMaxTransacciones = 100;
	var objResultSetTransacciones	= busquedaTransacciones.runSearch();
	var busquedaTransaccionesResult	= objResultSetTransacciones.getResults(intMinTransacciones, intMaxTransacciones);
	
	if(busquedaTransaccionesResult == null || busquedaTransaccionesResult.length == 0){
		return alert('No se han encontrado transacciones con los criterios ingresados.\nNota: En este módulo solo se generan Guías de Remisión pendientes de emisión.');
	}else{
		var paramFacturaT 	= nlapiGetFieldText('custpage_factura_filter_elect');
		return confirm('Se generará el comprobante ' + paramFacturaT + '.\nDesea continuar?');
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function lmryFactElectFieldChangedCLNT(type, name, linenum){
	//alert('Type: '+type+'; Name: '+name);
	return true;
}

function lmryFactElectValidateFieldCLNT(type, lblname, linenum) {
	/*
	if (  lblname=='custpage_factura_filter_elect' ) {		
		var Factura = nlapiGetFieldValue('custpage_factura_filter_elect');

		if (Factura!='' && Factura!=null) {
			nlapiSetFieldValue('custpage_datefrom_filter_elect', '');
			nlapiDisableField( 'custpage_datefrom_filter_elect', true);
			nlapiSetFieldValue('custpage_dateto_filter_elect', '');
			nlapiDisableField( 'custpage_dateto_filter_elect', true);
		}else{
			var newDate = new Date();
			nlapiSetFieldValue('custpage_datefrom_filter_elect',  nlapiDateToString(newDate));
			nlapiSetFieldValue('custpage_dateto_filter_elect', nlapiDateToString(newDate));
			
			nlapiDisableField( 'custpage_datefrom_filter_elect', false);
			nlapiDisableField( 'custpage_dateto_filter_elect', false);
		}
	}
	*/
	return true;
}