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
			var listalog = form.addSubList('custpage_sublista_envio_elect','staticlist','Estado del Tiempo de cuentas','custpage_maintab');
				listalog.addRefreshButton();
				listalog.addField('custpage_lmry_colu0', 'text', 'Ver');
				listalog.addField('custpage_lmry_colu1','text','Internal ID').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu2','text','Name').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu3', 'text', 'Customer').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu4', 'text', 'Periodo').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu5', 'text', 'Invoice').setDisplayType("disabled");
				listalog.addField('custpage_lmry_colu6', 'text', 'State').setDisplayType("disabled");

				
			
		// the records to be displayed are from a saved search
		var busquedaInfo = nlapiLoadSearch('customrecord_lmry_law360_state_acc_time', 'customsearch_lmry_law360_state_acc_tim_2');
			busquedaInfo.addFilter(new nlobjSearchFilter('customer', 'custrecord_lmry_law360_sacctime_project', 'anyof', nlapiGetUser()));
			nlapiLogExecution('ERROR','ID',nlapiGetUser());
		var resultSetInfo = busquedaInfo.runSearch();
		// only display rows from the search result that matches the value in the drop down
		var results = resultSetInfo.getResults(0, 1000);
		var urlns = objContext.getSetting('SCRIPT', 'custscript_lmry_netsuite_location');
		var idVar = '1023';
		for ( var i = 0; results != null && i < results.length; i++){
			var row = i + 1;
			var searchresult = results[i].getAllColumns();
			var idRea = results[i].getId();
			var linktext = '';
			
			var url = 'https://'+ urlns + '/app/common/custom/custrecordentry.nl?rectype='+idVar+'&id='+idRea;
			//var url = 'https://system.na1.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1023&id=104;
			if (url!=null && url!='') {
				  linktext = '<a target="_blank" href="'+url+'">Ver</a>';
			}
			nlapiLogExecution('ERROR','URL',url);
			
			listalog.setLineItemValue('custpage_lmry_colu0', row, linktext);
			listalog.setLineItemValue('custpage_lmry_colu1', row, results[i].getId());
			listalog.setLineItemValue('custpage_lmry_colu2', row, results[i].getValue(searchresult[0]));
			listalog.setLineItemValue('custpage_lmry_colu3', row, results[i].getText(searchresult[1]));
			listalog.setLineItemValue('custpage_lmry_colu4', row, results[i].getValue(searchresult[2]));
			listalog.setLineItemValue('custpage_lmry_colu5', row, results[i].getValue(searchresult[3]));
			listalog.setLineItemValue('custpage_lmry_colu6', row, results[i].getValue(searchresult[4]));
				
		}
		
	

		//Asigno Client Script
		//form.setScript('customscript_lmry_fact_elect_gr_pe_clnt');
		// Crea el formulario
		response.writePage(form);
	}else{
		
		
	}
}