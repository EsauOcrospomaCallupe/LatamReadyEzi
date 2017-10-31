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
var nameScript = "LMRY_PE_EI_BOL_MAS_CLNT"

function lmryEIBolSaveRecordCLNT(){
	
	var param_periodo	= nlapiGetFieldValue('custpage_periodo_filter');
	

	var busquedaTransacciones = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo', 'customsearch_lmry_pe_ei_boleteo_masivo');

	if (param_periodo != null && param_periodo != '') {
	
		busquedaTransacciones.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_period', null, 'anyof', param_periodo));
		
		var intMinTransacciones = 0;
		var intMaxTransacciones = 1000;
		var objResultSetTransacciones	= busquedaTransacciones.runSearch();
		var busquedaTransaccionesResult	= objResultSetTransacciones.getResults(intMinTransacciones, intMaxTransacciones);

		if(busquedaTransaccionesResult == null || busquedaTransaccionesResult.length == 0){
			return alert('No se han encontrado boletas con los criterios ingresados.\nNota: En este módulo solo se generan Boletas ya emitidas.');
		}else{
			
			return confirm('Este proceso generara transacciones según criterios ingresados.\n'+"Desea continuar?");
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
