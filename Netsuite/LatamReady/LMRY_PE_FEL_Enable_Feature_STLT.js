/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Nov 2015     LatamReady Consultor
 * File : LMRY_FEL_Enable_Feature_PE_STLT.js
 */

var objContext =  nlapiGetContext();
var LMRY_script = "LatamReady - PE Enable Feature FEL STLT";
var nameReport = 'Facturación Electrónica Perú - Enable Features';
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function enableFeaturesSTLT( request, response ){
	try { 
		
		if ( request.getMethod() == 'GET' ) {

			var form = nlapiCreateForm(nameReport);
			var grupo1 = form.addFieldGroup('custpage_group_features1', 'FEL PE - NetSuite');
				grupo1.setShowBorder(true);	
			var grupo2 = form.addFieldGroup('custpage_group_features2', 'FEL PE - Ambiente');
				grupo2.setShowBorder(true);	
			var grupo3 = form.addFieldGroup('custpage_group_features3', 'FEL PE - COMFIAR Acceso');
				grupo3.setShowBorder(true);
			var grupo4 = form.addFieldGroup('custpage_group_features4', 'FEL PE - Datos Subsidiaria');
				grupo4.setShowBorder(true);	
				
			var enviero  =	form.addField('custpage_lmry_pe_environm', 'text', 'LATAM - PE NetSuite Environment', null, 'custpage_group_features1')
			  , suitlet  =	form.addField('custpage_lmry_pe_stlt_prn', 'text', 'LATAM - PE NetSuite URL SuiteLet Impresion', null, 'custpage_group_features1')
			  ,	ws_host  =	form.addField('custpage_lmry_pe_ws_host' , 'text', 'LATAM - PE COMFIAR Host', null, 'custpage_group_features2')
			  ,	ws_ambi  =	form.addField('custpage_lmry_pe_ws_ambi' , 'text', 'LATAM - PE COMFIAR Ambiente', null, 'custpage_group_features2')
			  ,	ws_form  =	form.addField('custpage_lmry_pe_ws_form' , 'text', 'LATAM - PE COMFIAR Formato ID', null, 'custpage_group_features2')
			  ,	usuario  =	form.addField('custpage_lmry_pe_usuario' , 'text', 'LATAM - PE COMFIAR Usuario', null, 'custpage_group_features3')
			  , password =	form.addField('custpage_lmry_pe_password', 'text', 'LATAM - PE COMFIAR Password ', null, 'custpage_group_features3')
			  , url      =	form.addField('custpage_lmry_pe_url_wsc' , 'text', 'LATAM - PE COMFIAR URL ', null, 'custpage_group_features3')
			  , fel      =	form.addField('custpage_lmry_pe_fac_ele' , 'checkbox', 'LATAM - PE Facturacion Electronica', null, 'custpage_group_features3')
			  , ubigeo   =	form.addField('custpage_lmry_pe_ubigeo' , 'text', 'LATAM - PE Ubigeo', null, 'custpage_group_features4')
 , detraccion   =	form.addField('custpage_lmry_pe_detraccion' , 'text', 'LATAM - PE Detraccion', null, 'custpage_group_features4');
				enviero.setDefaultValue(objContext.getEnvironment());
				enviero.setHelpText('NetSuite Environment');
				enviero.setDisplayType("disabled");
			// Registro Personalizado LatamReady - Enable Feature FEL PE
			var coltabla = new Array();
				coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_url_stlt_imp');
				coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_usuario_ws');
				coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_password_ws');
				coltabla[3] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_url_acceso_ws');
				coltabla[4] =  new nlobjSearchColumn('custrecord_lmry_pe_fact_elect');
				coltabla[5] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_host_ws');
				coltabla[6] =  new nlobjSearchColumn('custrecord_lmry_pe_ambiente_ws');
				coltabla[7] =  new nlobjSearchColumn('custrecord_lmry_pe_formatoid_ws');
				coltabla[8] =  new nlobjSearchColumn('custrecord_lmry_pe_ubigeo');
				coltabla[9] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_detra');


			enabFeatureRecord = nlapiSearchRecord( 'customrecord_lmry_pe_fel_enable_feature'
				  , null
				  , null
				  , coltabla
				);

			if (enabFeatureRecord != '' && enabFeatureRecord != null) {
				suitlet.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_url_stlt_imp'));
				usuario.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_usuario_ws'));
				password.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_password_ws'));
				url.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_url_acceso_ws'));
				fel.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fact_elect'));
			    ws_host.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_host_ws'));
			    ws_ambi.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_ambiente_ws'));
			    ws_form.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_formatoid_ws'));
			    ubigeo.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_ubigeo'));
detraccion.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_detra'));
			}

			form.addSubmitButton('Guardar');
			// Crea el formulario
			response.writePage(form);

		}else{
			
			var suitlet  =	request.getParameter('custpage_lmry_pe_stlt_prn')
			  ,	usuario  =	request.getParameter('custpage_lmry_pe_usuario')
			  , password =	request.getParameter('custpage_lmry_pe_password')
			  , url      =	request.getParameter('custpage_lmry_pe_url_wsc')
			  , fel      =	request.getParameter('custpage_lmry_pe_fac_ele')
			  , ws_host  =	request.getParameter('custpage_lmry_pe_ws_host')
			  , ws_ambi  =	request.getParameter('custpage_lmry_pe_ws_ambi')
			  , ws_form  =	request.getParameter('custpage_lmry_pe_ws_form')
			  , ubigeo  =	request.getParameter('custpage_lmry_pe_ubigeo')
, detraccion  =	request.getParameter('custpage_lmry_pe_detraccion');

			var enabFeatureRecord = nlapiSearchRecord('customrecord_lmry_pe_fel_enable_feature');

			var logRecord = '';	
			if (enabFeatureRecord == null || enabFeatureRecord == '') {
				logRecord =	nlapiCreateRecord('customrecord_lmry_pe_fel_enable_feature');
			}else{
				logRecord = nlapiLoadRecord('customrecord_lmry_pe_fel_enable_feature', enabFeatureRecord[0].id);
			}		
				logRecord.setFieldValue('custrecord_lmry_pe_fel_url_stlt_imp' , suitlet);
				logRecord.setFieldValue('custrecord_lmry_pe_fel_usuario_ws'   , usuario);
				logRecord.setFieldValue('custrecord_lmry_pe_fel_password_ws'  , password);
				logRecord.setFieldValue('custrecord_lmry_pe_fel_url_acceso_ws', url);
				logRecord.setFieldValue('custrecord_lmry_pe_fact_elect'		  , fel); 
				logRecord.setFieldValue('custrecord_lmry_pe_fel_host_ws'	  , ws_host);
				logRecord.setFieldValue('custrecord_lmry_pe_ambiente_ws'  , ws_ambi);
				logRecord.setFieldValue('custrecord_lmry_pe_formatoid_ws' , ws_form);
				logRecord.setFieldValue('custrecord_lmry_pe_ubigeo' , ubigeo);
logRecord.setFieldValue('custrecord_lmry_pe_fel_detra' , detraccion);
			idLogGenerado = nlapiSubmitRecord(logRecord);			
			
			nlapiSetRedirectURL('SUITELET', nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
		}
	} catch(err) {

		var form  = nlapiCreateForm( "Enable FEL PE Features" );
		// Mensaje para el cliente
		var myInlineHtml = form.addField('custpage_lmry_v_message', 'inlinehtml').setLayoutType('outsidebelow','startcol');
		var strhtml = "<html>";
			strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
					"<tr>" +
					"</tr>" +
					"<tr>" +
					"<td class='text'>" +
					"<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Importante: Actualmente no esta configurado FEL EC.</div>" +
					"</td>" +
					"</tr>" +
					"</table>" +
					"</html>";
		myInlineHtml.setDefaultValue(strhtml);	
		
		response.writePage(form);		
	} // end try catch
}