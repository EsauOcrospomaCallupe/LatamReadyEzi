/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 oct 2014     LatamReady Consultor
 * File : LMRY_PEInvoiceURET.js
 */
var LMRY_script = 'LMRY PE Invoice URET';
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function PEInvUret_BeforeLoad(type, form, request){
	
  	if ( type=='view') {
		
			if ( nlapiGetFieldValue('custbody_lmry_pe_identificador_comfiar') != '' && nlapiGetFieldValue('custbody_lmry_pe_identificador_comfiar') != null ) {
				
				// Agrega botones
				form.addButton('custpage_lmry_Add_Button', 'Imprimir PDF', "PE_Imprimir_Pdf();");
				form.setScript('customscript_lmry_pe_invoice_clnt');
			}
		

	}


}