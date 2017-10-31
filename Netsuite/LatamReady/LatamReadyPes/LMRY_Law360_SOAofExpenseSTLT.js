/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Dic 2016     LatamReady Consultor
 * File : LMRY_Law360_SOAofExpenseSTLT.js
 */
var objContext = nlapiGetContext(); 
// Titulo del Suitelet
var namereport  = "LatamReady - Law360 Ejecucion de Estados de Cuenta de Gastos";
var LMRY_script = "LatamReady - Law360 SOA of Expense STLT";
// Parametro de configuracion
var daybill = objContext.getSetting('SCRIPT', 'custscript_lmry_billing_cycle');
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_law360_stacex_main(request, response){
	try {
		if ( request.getMethod() == 'GET' )
		{
			var form = nlapiCreateForm(namereport);
	
			// Criterios de Busqueda
			var group = form.addFieldGroup("custpage_lmry_law360_filran1", "Criterios de Busqueda");
			// Valida si es OneWorld
			var featuresubs = objContext.getFeature('SUBSIDIARIES');
			if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
			{
				var fieldsubs = form.addField('custpage_lmry_law360_sub', 'select', 'Subsidiaria', null, 'custpage_lmry_law360_filran1');
				// Filtros
				var filters = new Array();
					filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
					filters[1] = new nlobjSearchFilter('country', null, 'is', 'PE');
				// Columnas
				var columns = new Array();
					columns[0] = new nlobjSearchColumn('internalid');
					columns[1] = new nlobjSearchColumn('name');
				var searchctalt = nlapiSearchRecord('subsidiary', null, filters, columns);   
		        if ( searchctalt!=null && searchctalt!='' )
				{
		        	fieldsubs.addSelectOption('','');
					for (var i =0;i < searchctalt.length; i++)
					{
						var reportID = searchctalt[i].getValue('internalid');
						var reportNM = searchctalt[i].getValue('name');
						fieldsubs.addSelectOption(reportID, reportNM);
					}			
				}
				fieldsubs.setHelpText('Seleccione la Subsidiaria.');
				fieldsubs.setLayoutType('normal','startcol');
				fieldsubs.setMandatory(true);				
			}
			
			// Parametros
			var fieldsubs = form.addField('custpage_lmry_law360_per', 'select', 'Periodo Facturacion', 'accountingperiod', 'custpage_lmry_law360_filran1');
				fieldsubs.setHelpText('Ingrese el ultimo dia de facturacion.');
				fieldsubs.setLayoutType('normal','startcol');
				fieldsubs.setMandatory(true);
			
			// Valida si tiene activo Proyectos
			if (objContext.getFeature('jobs')==true || objContext.getFeature('jobs')=='T'){
				var fieldsubs = form.addField('custpage_lmry_law360_asu', 'select', 'Asunto', 'job', 'custpage_lmry_law360_filran1');
					fieldsubs.setHelpText('Seleccione la Subsidiaria.');
					fieldsubs.setLayoutType('normal','startcol');
			}

			group.setShowBorder(true);	
	
			// Mensaje para el cliente
			var myInlineHtml = form.addField('custpage_btn', 'inlinehtml').setLayoutType('outsidebelow','startcol');
			var strhtml = "<html>";
			strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
					"<tr>" +
					"</tr>" +
					"<tr>" +
					"<td class='text'>" +
					"<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Important: By using the NetSuite Invoice and Credit Memo, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.</div>" +
					"</td>" +
					"</tr>" +
					"</table>" +
					"</html>";
			myInlineHtml.setDefaultValue(strhtml);	
	
			form.addTab('custpage_lmry_cm_maintab', 'Tab');
			//sublista				
			var listalog = form.addSubList('custpage_lmry_log_sublista','staticlist','Log de Procesos','custpage_lmry_log_maintab');
				listalog.addField('custoage_lmry_law360_soae_log_dat'	, 'text', 'Fecha de creacion').setDisplayType("disabled");
				if (featuresubs == true || featuresubs == 'T') {
					listalog.addField('custpage_lmry_law360_soae_log_sub'	, 'text', 'Subsidiaria').setDisplayType("disabled");
				}
				listalog.addField('custpage_lmry_law360_soae_log_per'	, 'text', 'Periodo de Facturacion').setDisplayType("disabled");
				listalog.addField('custpage_lmry_law360_soae_log_pro'	, 'text', 'Parametro').setDisplayType("disabled");
				listalog.addField('custpage_lmry_law360_soae_log_emp'	, 'text', 'Creado por').setDisplayType("disabled");
				listalog.addField('custpage_lmry_law360_soae_log_sta'	, 'text', 'Status').setDisplayType("disabled");
				listalog.addField('custpage_lmry_law360_soae_log_end'	, 'text', 'Fecha Termino').setDisplayType("disabled");
				listalog.addRefreshButton();
	
			// the records to be displayed are from a saved search
			var s = nlapiLoadSearch('customrecord_lmry_law360_sta_acc_exp_log', 'customsearch_lmry_law360_sta_acc_exp_log');
			var resultSet = s.runSearch();
	
			// only display rows from the search result that matches the value in the drop down
			var results = resultSet.getResults(0, 1000);
			for ( var i = 0; results != null && i < results.length; i++) 
			{
				var row = i + 1;
				searchresult = results[i];
				listalog.setLineItemValue('custoage_lmry_law360_soae_log_dat', row, searchresult.getValue('created'));
				if (featuresubs == true || featuresubs == 'T') {
					listalog.setLineItemValue('custpage_lmry_law360_soae_log_sub', row, searchresult.getText('custrecord_lmry_law360_soae_log_sub'));
				}
				listalog.setLineItemValue('custpage_lmry_law360_soae_log_per', row, searchresult.getText('custrecord_lmry_law360_soae_log_per'));
				listalog.setLineItemValue('custpage_lmry_law360_soae_log_pro', row, searchresult.getText('custrecord_lmry_law360_soae_log_pro'));
				listalog.setLineItemValue('custpage_lmry_law360_soae_log_emp', row, searchresult.getText('custrecord_lmry_law360_soae_log_emp'));
				listalog.setLineItemValue('custpage_lmry_law360_soae_log_sta', row, searchresult.getValue('custrecord_lmry_law360_soae_log_sta'));
				listalog.setLineItemValue('custpage_lmry_law360_soae_log_end', row, searchresult.getValue('custrecord_lmry_law360_soae_log_end'));
			}

			// Botones del formulario
			form.addSubmitButton('Procesar');
			form.addResetButton('Cancelar');

			// Dibuja el formulario
			response.writePage(form);
		}
		else
		{	
			// Creacion de la linea en el log de errores
			var record = nlapiCreateRecord('customrecord_lmry_law360_sta_acc_exp_log');
				record.setFieldValue('custrecord_lmry_law360_soae_log_sub', request.getParameter('custpage_lmry_law360_sub'));
				record.setFieldValue('custrecord_lmry_law360_soae_log_per', request.getParameter('custpage_lmry_law360_per'));
				record.setFieldValue('custrecord_lmry_law360_soae_log_pro', request.getParameter('custpage_lmry_law360_asu'));
				record.setFieldValue('custrecord_lmry_law360_soae_log_emp', nlapiGetUser() );
				record.setFieldValue('custrecord_lmry_law360_soae_log_sta', 'Pendiente');
				record.setFieldValue('custrecord_lmry_law360_soae_log_end', '');
			var rec_id = nlapiSubmitRecord(record, true);

			// Valida si es OneWorld
			var featuresubs = objContext.getFeature('SUBSIDIARIES');

			// Parametros del Schedule
			var params = new Array();
				params['custscript_lmry_law360_param_soae_id']  = rec_id;
				if (featuresubs == true || featuresubs == 'T') {
					params['custscript_lmry_law360_param_soae_sub'] = request.getParameter('custpage_lmry_law360_sub');
				}
				params['custscript_lmry_law360_param_soae_per']  = request.getParameter('custpage_lmry_law360_per');
				params['custscript_lmry_law360_param_soae_job']  = request.getParameter('custpage_lmry_law360_asu');
				params['custscript_lmry_law360_param_soae_pos']  = 0;
			// Ejecuta el Shedule
			var status = nlapiScheduleScript('customscript_lmry_law360_stat_acex_schdl', 'customdeploy_lmry_law360_stat_acex_schdl', params);

			// Redireccion el script, vuelve a llamar al SuiteLet actual
			nlapiSetRedirectURL('SUITELET',nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
		}
	} catch(err) {
		law360_sendemail(err, LMRY_script);

		// Redireccion el script, vuelve a llamar al SuiteLet actual
		nlapiSetRedirectURL('SUITELET',nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
	}

	return true;
}