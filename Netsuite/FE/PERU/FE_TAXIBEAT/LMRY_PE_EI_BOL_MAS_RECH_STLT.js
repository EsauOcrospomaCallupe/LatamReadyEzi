/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Dec 2016     Ezi 
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var objContext = nlapiGetContext();
var nameReport = 'ELectronic Invoice PE - Boleteo Masivo Rechazado';
var nameScript = "LatamReady_PE_Boleteo_Masivo_Env_Rech";

function suiteletEIBolRechMasiva(request, response){
	
	if ( request.getMethod() == 'GET' ) {
		var form = nlapiCreateForm(nameReport);
		var grupo = form.addFieldGroup('custpage_group_filters', 'Filtros de envío');
		grupo.setShowBorder(true);	
		//Agregando filtros
		// Valida si es OneWorld
		var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (featuresubs == true || featuresubs == 'T'){
			form.addField('custpage_subsidiary_filter', 'select', 'Subsidiaria', 'subsidiary', 'custpage_group_filters');
		}
		//Filtro de Serie para solo Boletas
	    var listaSerie = form.addField('custpage_serie_filter', 'select', 'LATAM - PE EI Point of Sale', null, 'custpage_group_filters');
			// Filtros 
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_lmry_codigo_doc', 'custrecord_lmry_serie_tipo_doc_cxc', 'is', '03'); // Serie para Boleta
			// Columnas
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('name');//Serie
			var searchctalt = nlapiSearchRecord('customrecord_lmry_serie_impresion_cxc', null, filters, columns);   
			if(searchctalt != null)
			{
			    listaSerie.addSelectOption('','');
				for (var i =0;i < searchctalt.length; i++)
				{
					nlapiLogExecution('ERROR','SERIE',reportNM+'-'+reportID);
					var reportID = searchctalt[i].getValue('internalid');
					var reportNM = searchctalt[i].getValue('name');
					listaSerie.addSelectOption(reportID, reportNM);
				}	
			}
			listaSerie.setHelpText('Seleccionar la serie a generar');
			listaSerie.setMandatory(true);

		form.addField('custpage_datefrom_filter', 'date', 'LATAM - PE EI Date From', 'custpage_group_filters').setMandatory(true);
		form.addField('custpage_dateto_filter', 'date', 'LATAM - PE EI Date To', 'custpage_group_filters').setMandatory(true);
		
		form.addTab('custpage_maintab', 'Tab');
		//Sublista 
		var listalog = form.addSubList('custpage_sublista_envio_elect','staticlist','Estado de comprobantes generados','custpage_maintab');
			listalog.addRefreshButton();
			listalog.addField('custpage_lmry_lote_internalid','text','ID Lote').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_datecreated','text','Fecha').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_subsidiaria', 'text', 'Subsidiaria').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_creadopor', 'text', 'Creado por').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_transaccion', 'text', 'Transaccion').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_estado', 'text', 'Estado').setDisplayType("disabled");
			listalog.addField('custpage_lmry_lote_respuestacomfiar', 'text', 'Respuesta COMFIAR').setDisplayType("disabled");
			//listalog.addField('custpage_lmry_lote_autogenerado', 'text', 'AutoGenerado Nubox').setDisplayType("disabled");
				
			
		// the records to be displayed are from a saved search
		var busquedaInfo = nlapiLoadSearch('customrecord_lmry_pe_ei_bol_mas_log', 'customsearch_lmry_pe_ei_bol_mas_log');
			
		var resultSetInfo = busquedaInfo.runSearch();
		// only display rows from the search result that matches the value in the drop down
		var results = resultSetInfo.getResults(0, 1000);
		for ( var i = 0; results != null && i < results.length; i++){
			var row = i + 1;
			var searchresult = results[i].getAllColumns();
			
			listalog.setLineItemValue('custpage_lmry_lote_internalid',	row, results[i].getId());
			listalog.setLineItemValue('custpage_lmry_lote_datecreated',	row, results[i].getValue(searchresult[0]));
			listalog.setLineItemValue('custpage_lmry_lote_subsidiaria', row, results[i].getText(searchresult[1]));
			listalog.setLineItemValue('custpage_lmry_lote_creadopor', row, results[i].getText(searchresult[2]));
			listalog.setLineItemValue('custpage_lmry_lote_transaccion', row, results[i].getText(searchresult[3]));
			listalog.setLineItemValue('custpage_lmry_lote_estado', row, results[i].getValue(searchresult[4]));
			listalog.setLineItemValue('custpage_lmry_lote_respuestacomfiar', row, results[i].getValue(searchresult[5]));
			
			
					
			//listalog.setLineItemValue('custpage_lmry_lote_pdf', row, '');			
		}
		// Botones del formulario
		form.addSubmitButton('Generar');
		form.addResetButton('Cancelar');
		//Asigno Client Script
		form.setScript('customscript_lmry_pe_ei_bol_mas_env_rech_clnt');
		// Crea el formulario
		response.writePage(form);
	}else{
		
		var params = new Array();
		var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (featuresubs == true || featuresubs == 'T'){
			params['custscript_lmry_pe_rech_subsi'] = request.getParameter('custpage_subsidiary_filter');
		}
		params['custscript_lmry_pe_rech_series'] 		= request.getParameter('custpage_serie_filter');
		params['custscript_lmry_pe_rech_date_from'] 	= request.getParameter('custpage_datefrom_filter');
		params['custscript_lmry_pe_rech_date_to'] 	= request.getParameter('custpage_dateto_filter');

		//
		

		var status = nlapiScheduleScript('customscript_lmry_pe_ei_bol_mas_rec_schd', 'customdeploy_lmry_pe_ei_bol_mas_rec_schd', params);
		//nlapiLogExecution('ERROR', 'Schedule Script', 'status: '+status);
		nlapiSetRedirectURL('SUITELET','customscript_lmry_pe_ei_bol_mas_rec_stlt','customdeploy_lmry_pe_ei_bol_mas_rec_stlt',false,null);
	}
}