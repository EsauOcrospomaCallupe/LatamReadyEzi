/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       2016     		  LatamReady Consultor
 * File : LMRY_PE_Invoice_CLNT.js
 */
var objContext = nlapiGetContext();
var LMRY_script = 'LatamReady - PE Invoice CLNT';
var LMRY_countr = new Array();

function INVClntPE_PageInit(type) {
	try 
	{

	} catch(error) {
		pe_send_email(' [ INVClntPE_PageInit ] ' + error, LMRY_script);
	}
}

function INVClntPE_SaveRecord() {
	try 
	{	
		// Valida el Acceso
		PE_Validate_Access_Inv( nlapiGetFieldValue('subsidiary') );
		if(LMRY_countr[0]=='PE'){
			/*
			var discounttotal = nlapiGetFieldValue('discounttotal');
			//alert('discounttotal: ' +discounttotal);
		
			if (discounttotal != 0.0) {
				alert('Facturación Electrónica Perú no admite descuentos de cabecera. Edite el documento, por favor.');
				return false;
			}
			*/
			var autoDetra = nlapiLookupField('customrecord_lmry_pe_fel_enable_feature','1','custrecord_lmry_pe_auto_detra');
					nlapiLogExecution('ERROR', 'autoDetra' , autoDetra);
					var witaxrate	= nlapiGetFieldValue('custpage_4601_witaxrate');
					var porcentaje1= nlapiGetFieldValue('custbody_lmry_porcentaje_detraccion');
					var porcentaje2= witaxrate;
					nlapiLogExecution('ERROR','porcentaje1',porcentaje1);
					nlapiLogExecution('ERROR','porcentaje2',porcentaje2);
					if(porcentaje1 == '0.0%'){
						porcentaje1='';
					}
					//Si la autodetraccion es falsa, tienen que coincidir los campos de porcentaje :D
					if(autoDetra=='F'){
						if(porcentaje1!=porcentaje2){

							alert('Los porcentajes de LATAM - PE PORCENTAJE DETRACCION y TAX RATE deben coincidir');
							return false;

						}
						
					}
		}
	
	} catch(error) {
		pe_send_email(' [ INVClntPE_SaveRecord ] ' + error, LMRY_script);
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
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function INVClntPE_ValidateField(type, name, linenum){

	try 
	{
		if (name=='custbody_lmry_document_type' &&
			 nlapiGetFieldValue('custbody_lmry_document_type')!='' &&
			 nlapiGetFieldValue('custbody_lmry_document_type')!=null) 
		{
			// Valida el Acceso
			PE_Validate_Access_Inv( nlapiGetFieldValue('subsidiary') );
			
			if (LMRY_countr[0]=='PE')
			{
				var coltabla = new Array();
					coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_txd_tipo_docu');
					coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_txd_template');
					coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_txd_metodo_envio');
				var filters = new Array();
					filters[0] =  new nlobjSearchFilter('custrecord_lmry_pe_txd_tipo_docu', null, 'anyof' , nlapiGetFieldValue('custbody_lmry_document_type'));

				var tabla = nlapiSearchRecord( 'customrecord_lmry_pe_template_x_doc', null, filters, coltabla);				
				if (tabla != null && tabla != '') 
				{
					if (tabla.length>0)
					{
						var regtabla = tabla[0];
						var tipoDoc  = regtabla.getValue('custrecord_lmry_pe_txd_tipo_docu');
						var template = regtabla.getValue('custrecord_lmry_pe_txd_template');
						var metodo   = regtabla.getValue('custrecord_lmry_pe_txd_metodo_envio');

						nlapiLogExecution('ERROR', 'tipoDoc - template - método' , tipoDoc + ' - ' + template + ' - ' + metodo);
						
						nlapiSetFieldValue('custbody_psg_ei_template', template);
						nlapiSetFieldValue('custbody_psg_ei_sending_method', metodo);
						
					}
				}
				
				nlapiLogExecution('ERROR', 'custbody_lmry_document_type :' , nlapiGetFieldValue('custbody_lmry_document_type'));
				return true;
			}
		}
	} catch(error) {
		pe_send_email(' [ INVClntPE_FieldChanged ] ' + error, LMRY_script);	
	}
	
	return true;
}

/* ------------------------------------------------------------------------------------------------------
 * A la variable featureId se le asigna el valore que le corresponde 
 * --------------------------------------------------------------------------------------------------- */
function PE_Validate_Access_Inv(ID) {
	try{
		// Inicializa variables Locales y Globales
		LMRY_countr = PE_Get_Country_STLT(ID);
	} catch(error){
		pe_send_email(' [ PE_Validate_Access_Inv ] ' +error, LMRY_script);
	}

	return true;
}

function PE_Imprimir_Pdf(){

  
	var namerdid = nlapiGetRecordId();

	var datosImp = nlapiLookupField('invoice', namerdid, ['custbody_lmry_pe_identificador_comfiar', 'custbody_lmry_serie_doc_cxc','custbody_lmry_document_type','custbody_lmry_num_preimpreso']);
	  
	var transaccionId = datosImp.custbody_lmry_pe_identificador_comfiar;
	// var cuitId  = datosImp.subsidiary;
	var puntoDeVentaIdWS = datosImp.custbody_lmry_serie_doc_cxc;
	var codDoc = datosImp.custbody_lmry_document_type;
	var nroCbte = datosImp.custbody_lmry_num_preimpreso;

	var puntoDeVentaId = nlapiLookupField('customrecord_lmry_serie_impresion_cxc', puntoDeVentaIdWS,'name');
	var codDocc = nlapiLookupField('customrecord_lmry_tipo_doc', codDoc,'custrecord_lmry_codigo_doc');
	
	var url = nlapiResolveURL('SUITELET', 'customscript_lmry_pe_fel_impresion_stlt', 'customdeploy_lmry_pe_fel_impresion_stlt') + '&tranid=' + transaccionId + '&namerdid=' + namerdid + '&ptoVenta=' + puntoDeVentaId + '&codDoc=' + codDocc + '&nroCbte=' + nroCbte;
	//show the PDF file 
	newWindow = window.open(url);


}