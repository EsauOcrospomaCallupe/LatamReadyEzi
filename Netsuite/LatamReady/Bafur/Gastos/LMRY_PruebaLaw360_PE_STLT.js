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
var nameReport = 'LatamReady - Law360 Test STLT';
var nameScript = "LMRY_PruebaLaw360_PE_STLT";

function suiteletPrueba(request, response){
	
	if ( request.getMethod() == 'GET' ) {
		var form = nlapiCreateForm(nameReport);
		var grupo = form.addFieldGroup('custpage_group_filters', 'Filtros de envío');
			grupo.setShowBorder(true);	
			//Agregando filtros
			// Valida si es OneWorld
			
			form.addTab('custpage_maintab', 'Tab');
			//Sublista 
			var listalog = form.addSubList('custpage_sublista_envio_elect','staticlist','Estado de comprobantes generados','custpage_maintab');
				listalog.addRefreshButton();
				listalog.addField('custpage_lmry_colu1','text','ID Lote').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu2','text','Fecha').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu3', 'text', 'Subsidiaria').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu4', 'text', 'Creado por').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu5', 'text', 'Transaccion').setDisplayType("disabled");
				
			
		// the records to be displayed are from a saved search
		var busquedaInfo = nlapiLoadSearch('customrecord_lmry_law360_state_acc_expen', 'customsearch_lmry_law360_state_acc_exp_2');
		//	busquedaInfo.addFilter(new nlobjSearchFilter('customer', 'custrecord_lmry_law360_saccexpe_project', 'is', nlapiGetUser()));
		var resultSetInfo = busquedaInfo.runSearch();
		// only display rows from the search result that matches the value in the drop down
		var results = resultSetInfo.getResults(0, 1000);
		for ( var i = 0; results != null && i < results.length; i++){
			var row = i + 1;
			var searchresult = results[i].getAllColumns();
			
			listalog.setLineItemValue('custpage_lmry_colu1', row, results[i].getText(searchresult[0]));
			listalog.setLineItemValue('custpage_lmry_colu2', row, results[i].getText(searchresult[1]));
			listalog.setLineItemValue('custpage_lmry_colu3', row, results[i].getText(searchresult[2]));
			listalog.setLineItemValue('custpage_lmry_colu4', row, results[i].getText(searchresult[3]));
			listalog.setLineItemValue('custpage_lmry_colu5', row, results[i].getText(searchresult[4]));
			
			
			

			
			//listalog.setLineItemValue('custpage_lmry_lote_pdf', row, '');			
		}
		// Botones del formulario
		form.addSubmitButton('Generar');
		form.addResetButton('Cancelar');
		//Asigno Client Script
		//form.setScript('customscript_lmry_fact_elect_gr_pe_clnt');
		// Crea el formulario
		response.writePage(form);
	}else{
		
		var params = new Array();
		var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (featuresubs == true || featuresubs == 'T'){
			params['custscript_lmry_fel_sub_gr_pe'] = request.getParameter('custpage_subsidiary_filter_elect');
		}
		params['custscript_lmry_fel_enti_gr_pe'] 		= request.getParameter('custpage_entity_filter_elect');
		params['custscript_lmry_fel_fac_gr_pe'] 	= request.getParameter('custpage_factura_filter_elect');
		//
		params['custscript_lmry_fel_identi_gr_pe'] 	= '06';
		

		var status = nlapiScheduleScript('customscript_lmry_fact_elect_gr_pe_schdl', 'customdeploy_lmry_fact_elect_gr_pe_schdl', params);
		//nlapiLogExecution('ERROR', 'Schedule Script', 'status: '+status);
		nlapiSetRedirectURL('SUITELET','customscript_lmry_fact_elect_gr_pe_stlt','customdeploy_lmry_fact_elect_gr_pe_stlt',false,null);
	}
}