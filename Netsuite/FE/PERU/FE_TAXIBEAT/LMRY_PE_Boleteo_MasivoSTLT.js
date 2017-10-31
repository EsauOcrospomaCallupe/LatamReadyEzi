/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Jun 2011     Ezi 
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var objContext = nlapiGetContext();
var nameReport = 'Generador de Boleta de Resumen';
var nameScript = "LatamReady_PE_Boleteo_Masivo";

function suiteletEIBolMasiva(request, response){
	
	if ( request.getMethod() == 'GET' ) {
		var form = nlapiCreateForm(nameReport);
		var grupo = form.addFieldGroup('custpage_group_filters', 'Filtros de envío');
		grupo.setShowBorder(true);	
		//Agregando filtros
		form.addField('custpage_periodo_filter', 'select','LATAM - PE Periodo','accountingperiod',  'custpage_group_filters').setMandatory(true);


			// Mensaje para el cliente
			var myInlineHtml = form.addField('custpage_btn', 'inlinehtml').setLayoutType('outsidebelow','startcol');
			var strhtml = "<html>";
			strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
					"<tr>" +
					"</tr>" +
					"<tr>" +
					"<td class='text'>" +
					"<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Importante: Se generaran boletas por cada dia </div>" +
					"</td>" +
					"</tr>" +
					"</table>" +
					"</html>";
			myInlineHtml.setDefaultValue(strhtml);		
			
			form.addTab('custpage_maintab', 'Tab');
					
			
		//Sublista 
		var listalog = form.addSubList('custpage_sublista_envio_elect','staticlist','Estado de Boletas generadas','custpage_maintab');
			listalog.addRefreshButton();
			listalog.addField('custpage_lmry_lote_internalid','text','ID Lote').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_datecreated','text','Fecha').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_subsidiaria', 'text', 'Subsidiaria').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_creadopor', 'text', 'Creado por').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_transaccion', 'text', 'Transaccion').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_periodo', 'text', 'Periodo').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_desd_hasta', 'text', 'Numero Preimpreso Desde-Hasta').setDisplayType("disabled");
			
		// the records to be displayed are from a saved search
		var busquedaInfo = nlapiLoadSearch('customrecord_lmry_pe_bol_mas_log', 'customsearch_lmry_pe_bol_mas_log');
			
		var resultSetInfo = busquedaInfo.runSearch();
		// only display rows from the search result that matches the value in the drop down
		var results = resultSetInfo.getResults(0, 1000);
		for ( var i = 0; results != null && i < results.length; i++){
			var row = i + 1;
			var searchresult = results[i].getAllColumns();
			
			listalog.setLineItemValue('custpage_lmry_lote_internalid',	row, results[i].getId());
			listalog.setLineItemValue('custpage_lmry_lote_datecreated',	row, results[i].getValue(searchresult[0]));
			listalog.setLineItemValue('custpage_lmry_lote_subsidiaria', row, results[i].getText(searchresult[2]));
			listalog.setLineItemValue('custpage_lmry_lote_creadopor', row, results[i].getText(searchresult[3]));
			var transacid=results[i].getValue(searchresult[4]);
          	var transac=results[i].getText(searchresult[4]);
	var urlns = objContext.getSetting('SCRIPT', 'custscript_lmry_netsuite_location');
          var linktext = '';
          var url = 'https://'+ urlns + '/app/accounting/transactions/custinvc.nl?id='+transacid;
			if (url!=null && url!='') {
				  linktext = '<a target="_blank" href="'+url+'">'+transac+'</a>';
			}

			listalog.setLineItemValue('custpage_lmry_lote_transaccion', row, linktext);	
          listalog.setLineItemValue('custpage_lmry_lote_periodo', row, results[i].getValue(searchresult[5]));
			listalog.setLineItemValue('custpage_lmry_lote_desd_hasta', row, results[i].getValue(searchresult[6]));
			
					
			//listalog.setLineItemValue('custpage_lmry_lote_pdf', row, '');			
		}
		// Botones del formulario
		form.addSubmitButton('Generar');
		form.addResetButton('Cancelar');
		//Asigno Client Script
		form.setScript('customscript_lmry_pe_bol_mas_env_clnt');
		// Crea el formulario
		response.writePage(form);
	}else{
		
		var params = new Array();
		
		//var periodname = nlapiLookupField('accountingperiod', request.getParameter('custpage_periodo_filter'), 'periodname');
		
			params['custscript_lmry_pe_bol_periodo']  = request.getParameter('custpage_periodo_filter');


		//
		

		var status = nlapiScheduleScript('customscript_lmry_pe_ei_boleteo_masivo', 'customdeploy_lmry_pe_ei_boleteo_masivo', params);
		//nlapiLogExecution('ERROR', 'Schedule Script', 'status: '+status);
		nlapiSetRedirectURL('SUITELET','customscript_lmry_pe_bol_mas_stlt','customdeploy_lmry_pe_bol_mas_stlt',false,null);
	}
}