/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Jul 2017     LatamReady DEV
 * File : LMRY_PE_EI_Enable_Feature_STLT.js
 */

var objContext =  nlapiGetContext();
var LMRY_script = "LatamReady - PE Enable Feature EI STLT";
var nameReport = 'Facturación Electrónica Perú EI - Enable Features';
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function enableFeaturesSTLT( request, response ){
	try { 
		
		if ( request.getMethod() == 'GET' ) {

			var form = nlapiCreateForm(nameReport);
			var grupo1 = form.addFieldGroup('custpage_group_features1', 'EI PE - NetSuite');
				grupo1.setShowBorder(true);
				
			var template  =	form.addField('custpage_lmry_pe_ei_temp_factu', 'text', 'LATAM - PE EI ID Formulario', null, 'custpage_group_features1')
            , items  =	form.addField('custpage_lmry_pe_ei_items', 'text', 'LATAM - PE EI Item', null, 'custpage_group_features1')
            , location  =	form.addField('custpage_lmry_pe_ei_location', 'text', 'LATAM - PE EI Location', null, 'custpage_group_features1');
			// Registro Personalizado LatamReady - Enable Feature FEL PE
			var coltabla = new Array();
         		coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_temp_factu');
				coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_items');
          		coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_location');
          
			enabFeatureRecord = nlapiSearchRecord( 'customrecord_lmry_pe_ei_enable_feature'
				  , null
				  , null
				  , coltabla
				);

			if (enabFeatureRecord != '' && enabFeatureRecord != null) {
				template.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_temp_factu'));
				items.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_items'));
                location.setDefaultValue(enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_location'));
			}

			form.addSubmitButton('Guardar');
			// Crea el formulario
			response.writePage(form);

		}else{
			var temp_fact  =	request.getParameter('custpage_lmry_pe_ei_temp_factu')
              , items_ei = 	request.getParameter('custpage_lmry_pe_ei_items')
            , location = request.getParameter('custpage_lmry_pe_ei_location');

			var enabFeatureRecord = nlapiSearchRecord('customrecord_lmry_pe_ei_enable_feature');

			var logRecord = '';
			if (enabFeatureRecord == null || enabFeatureRecord == '') {
				logRecord =	nlapiCreateRecord('customrecord_lmry_pe_ei_enable_feature');
			}else{
				logRecord = nlapiLoadRecord('customrecord_lmry_pe_ei_enable_feature', enabFeatureRecord[0].id);
			}
				logRecord.setFieldValue('custrecord_lmry_pe_ei_temp_factu' , temp_fact);
          		logRecord.setFieldValue('custrecord_lmry_pe_ei_items', items_ei);
          		logRecord.setFieldValue('custrecord_lmry_pe_ei_location', location);
			idLogGenerado = nlapiSubmitRecord(logRecord);
			nlapiSetRedirectURL('SUITELET', nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
		}
	} catch(err) {
      
      nlapiLogExecution('ERROR','error',err);

		var form  = nlapiCreateForm( "Enable EI PE Features" );
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