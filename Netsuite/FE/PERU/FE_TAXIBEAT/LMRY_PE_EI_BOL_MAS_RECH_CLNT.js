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
var nameScript = "LMRY_PE_EI_BOL_MAS_RECH_CLNT"

function lmryEIBolRechInitPageCLNT(){
	/*
	var newDate = new Date();
	nlapiSetFieldValue('custpage_datefrom_filter_elect',  nlapiDateToString(newDate));
	nlapiSetFieldValue('custpage_dateto_filter_elect', nlapiDateToString(newDate));
	*/
	return true;
}
function lmryEIBolRechSaveRecordCLNT(){
	var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
	if (featuresubs == true || featuresubs == 'T'){
		var paramSubsidiaria	= nlapiGetFieldValue('custpage_subsidiary_filter');
	}
	var param_date_from 	= nlapiGetFieldValue('custpage_datefrom_filter');
	var param_date_to		= nlapiGetFieldValue('custpage_dateto_filter');
	var param_serie		= nlapiGetFieldValue('custpage_serie_filter');
	

	var busquedaTransacciones = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo', 'customsearch_lmry_pe_ei_bol_mas_docs');

	if (param_date_from != null && param_date_from != '' && param_date_to != null && param_date_to != '' && param_serie != null && param_serie != '') {

		if ((featuresubs == true || featuresubs == 'T') && paramSubsidiaria!='' && paramSubsidiaria!='null' && paramSubsidiaria!=null){
			//busquedaTransacciones.addFilter(new nlobjSearchFilter('subsidiary', null, 'anyof', paramSubsidiaria));
		}
	
		busquedaTransacciones.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_point_sale', null, 'anyof', param_serie));
	
		busquedaTransacciones.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_date', null, 'onorafter', param_date_from));
		
		busquedaTransacciones.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_date', null, 'onorbefore', param_date_to));
	
		busquedaTransacciones.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_status', null, 'is', 'RECHAZADO'));

		busquedaTransacciones.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_id_line', null, 'equalto', '1'));
		
		var intMinTransacciones = 0;
		var intMaxTransacciones = 1000;
		var objResultSetTransacciones	= busquedaTransacciones.runSearch();
		var busquedaTransaccionesResult	= objResultSetTransacciones.getResults(intMinTransacciones, intMaxTransacciones);

		if(busquedaTransaccionesResult == null || busquedaTransaccionesResult.length == 0){
			return alert('No se han encontrado transacciones con los criterios ingresados.\nNota: En este módulo solo se generan Boletas pendientes de emisión.');
		}else{
			
			return confirm('Este proceso enviará ' + busquedaTransaccionesResult.length + ' transacciones según criterios ingresados.\n'+"Desea continuar?");
		}
	}
	return true;
		
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
