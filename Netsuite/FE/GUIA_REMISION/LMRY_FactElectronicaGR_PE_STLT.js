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
var nameReport = 'Facturación Electrónica PE - Guía de Remisión';
var nameScript = "LMRY_FactElectronicaGR_PE_STLT";

function suiteletFactElectMasiva(request, response){
	
	if ( request.getMethod() == 'GET' ) {
		var form = nlapiCreateForm(nameReport);
		var grupo = form.addFieldGroup('custpage_group_filters', 'Filtros de envío');
			grupo.setShowBorder(true);	
			//Agregando filtros
			// Valida si es OneWorld
			var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
			if (featuresubs == true || featuresubs == 'T'){
				form.addField('custpage_subsidiary_filter_elect', 'select', 'Subsidiaria', 'subsidiary', 'custpage_group_filters');
			}
			form.addField('custpage_entity_filter_elect', 'select', 'Cliente', 'customer', 'custpage_group_filters');
			form.addField('custpage_factura_filter_elect', 'select', 'Documento', 'transaction', 'custpage_group_filters').setMandatory(true);
			
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
				listalog.addField('custpage_lmry_lote_pdf', 'text', 'Archivo PDF');
			
		// the records to be displayed are from a saved search
		var busquedaInfo = nlapiLoadSearch('customrecord_lmry_pe_fel_lote_envio', 'customsearch_lmry_lote_envio_electro_pe');
			busquedaInfo.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_envio_iden', null, 'is', '06'));
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
			
			var resp = results[i].getValue(searchresult[5]).split('Transaccion ID: ');
			var TransaccionID = '';			
			if(resp[1]!=null && resp[1]!=''){
				TransaccionID = resp[1];
			}

			var CbteId = '06';

			var linktext = '';
			//Variable global Latam - EC URL Suitlet Impresion COMFIAR
			//var url = objContext.getSetting('SCRIPT', 'custscript_lmry_url_stlt_imp_comfiar_ec');
			
			var url = '';

			// Registro Personalizado LatamReady - EC Enable Feature FEL
			enabFeatureRecord = nlapiSearchRecord( 'customrecord_lmry_pe_fel_enable_feature'
				  , null
				  , null
				  , new nlobjSearchColumn('custrecord_lmry_pe_fel_url_stlt_imp')
				);

			if (enabFeatureRecord != null && enabFeatureRecord != '') {
				url = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_url_stlt_imp');
			}	
			
			url = url+'&TransacID='+TransaccionID+'&CbteId='+CbteId;
			//var url = 'https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=389&deploy=1&folio='+auxiliarFolio;
			if (url!=null && url!='' && TransaccionID!='') {
				  linktext = '<a target="_blank" href="'+url+'">Descarga</a>';
			}
			listalog.setLineItemValue('custpage_lmry_lote_pdf', row, linktext);	
					
			//listalog.setLineItemValue('custpage_lmry_lote_pdf', row, '');			
		}
		// Botones del formulario
		form.addSubmitButton('Generar');
		form.addResetButton('Cancelar');
		//Asigno Client Script
		form.setScript('customscript_lmry_fact_elect_gr_pe_clnt');
		// Crea el formulario
		response.writePage(form);
	}else{
		nlapiLogExecution('ERROR','Holi','Entro');
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