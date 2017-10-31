/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 feb 2016     LatamReady Consultor
 * File : LMRY_PE2016Corp_ReportGeneratorSTLT.js 
 */
var objContext = nlapiGetContext();
// Titulo del Suitelet
var namereport = "LatamReady - Declaracion Mensual Corp PLE 2016";
var LMRY_script = "Latam Report Generator PE2016 Corp STLT";
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_main(request, response){
	try {
		if ( request.getMethod() == 'GET' ) {
			// Crea el folder
			search_folder();
			
			// Valida si es OneWorld
			var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');

			var form = nlapiCreateForm(namereport);
			
			/* ****** Grupo de Campos Criterios de Busqueda ****** */
			var group = form.addFieldGroup('custpage_filran1', 'Tipos de Reporte');
			
			//Obtiene los datos de la lista de reportes SUNAT
			var fieldreports = form.addField('custpage_lmry_2016_reporte', 'select', 'Reporte', null, 'custpage_filran1');
				var filters = new Array();
					filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
				var columns = new Array();
					columns[0] = new nlobjSearchColumn('internalid');
					columns[1] = new nlobjSearchColumn('name');
				var searchctalt = nlapiSearchRecord('customrecord_lmry_pe_corp_2016_features', null, filters, columns);   
		        if(searchctalt != null)
				{
		        	fieldreports.addSelectOption('','');
					for (var i =0;i < searchctalt.length; i++) 
					{
						var reportID = searchctalt[i].getValue('internalid');
						var reportNM = searchctalt[i].getValue('name');
						fieldreports.addSelectOption(reportID, reportNM);
					}			
				}
				fieldreports.setHelpText('Seleccionar reporte a generar');
				fieldreports.setMandatory(true);
				fieldreports.setLayoutType('normal','startcol');
			group.setShowBorder(true);
			
			/* ****** Grupo de Campos Criterios de Busqueda ****** */
			var group = form.addFieldGroup('custpage_filran2', 'Criterios de Busqueda');
	
			// Valida si es OneWorld
			if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
			{
				var fieldsubs = form.addField('custpage_2016_subsidiary', 'select', 'Subsidiaria', null, 'custpage_filran2');
					// Filtros
					var filters = new Array();
						filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
						filters[1] = new nlobjSearchFilter('country', null, 'is', 'PE');
					// Columnas
					var columns = new Array();
						columns[0] = new nlobjSearchColumn('internalid');
						columns[1] = new nlobjSearchColumn('name');
					var searchctalt = nlapiSearchRecord('subsidiary', null, filters, columns);   
			        if(searchctalt != null)
					{
			        	fieldsubs.addSelectOption('','');
						for (var i =0;i < searchctalt.length; i++)
						{
							var reportID = searchctalt[i].getValue('internalid');
							var reportNM = searchctalt[i].getValue('name');
							fieldsubs.addSelectOption(reportID, reportNM);
						}			
					}
					fieldsubs.setHelpText('Subsidiaria.');
					fieldsubs.setMandatory(true);
			}		
			
			/* ************************************************************
			 * Realiza busqueda por todos los campos agregados en la tabla 
			 * de filtros de reportes
			 * ***********************************************************/
	
			// Campos del Query
			var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filter_custp');
				columns[1] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filt_fie_typ'); 
				columns[2] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filt_fie_lab');
				columns[3] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filt_lis_rec');
				columns[4] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filt_fie_hel');
				columns[5] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filter_order');
				columns[5].setSort();
				
			// Registro personalizado de campos a mostrar en el SuiteLet
			var transacdata = nlapiSearchRecord('customrecord_lmry_pe_corp_2016_filt_rept', 'customsearch_lmry_pe_corp_2016_filt_rept', null, columns);
			var auxfield = '';
			for(var i = 0; i < transacdata.length; i++)
			{
				var idField 	= transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filter_custp');
				var tipoField	= transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filt_fie_typ');
				var lblField	= transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filt_fie_lab');
				var listaRec	= transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filt_lis_rec');
				if (listaRec=='') { listaRec=null; }
				var ayudaField	= transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filt_fie_hel');
				/* ************************************************************
				 * Agregando los campos, definidos en un registro personalizado
				 * idField		= ID Field
				 * tipoField  	= Type
				 * lblField 	= label
				 * listaRec		= List/Record
				 * ************************************************************/
				if ( auxfield!= idField && idField!='' && idField!=null)
				{
					auxfield = idField;
					var addFieldAux = form.addField(idField, tipoField, lblField, listaRec, 'custpage_filran2');
						addFieldAux.setHelpText(ayudaField);
				}
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
					"<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Important: By using the NetSuite Transaction, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.</div>" +
					"</td>" +
					"</tr>" +
					"</table>" +
					"</html>";
			myInlineHtml.setDefaultValue(strhtml);		
			
			form.addTab('custpage_maintab', 'Tab');
			//sublista				
			var listalog = form.addSubList('custpage_sublista','staticlist','Log de generacion','custpage_maintab');
				listalog.addField('custpage_lmry_rg_trandate','text','Fecha de creacion').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_transaction', 'text', 'Informe').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_postingperiod', 'text', 'Periodo').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_subsidiary', 'text', 'Subsidiaria').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_employee', 'text', 'Creado por').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_nombre', 'text', 'Nombre archivo').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_archivo', 'text', 'Descargar').setDisplayType("normal");
				listalog.addRefreshButton();
					
			// the records to be displayed are from a saved search
			var s = nlapiLoadSearch('customrecord_lmry_pe_corp_2016_gener_log', 'customsearch_lmry_pe_corp_2016_gener_log');
			var resultSet = s.runSearch();

			// only display rows from the search result that matches the value in the drop down
			var results = resultSet.getResults(0, 1000);
			for ( var i = 0; results != null && i < results.length; i++) 
			{
			  var row = i + 1;
			  searchresult = results[i];
		
			  var periodname = searchresult.getValue('custrecord_lmry_pe_corp_2016_postingperi');
			  var linktext = '';
			  var url = searchresult.getValue('custrecord_lmry_pe_corp_2016_url_file');
			  if (url!=null && url!='') {
				  linktext = '<a target="_blank" href="'+searchresult.getValue('custrecord_lmry_pe_corp_2016_url_file')+'">Descarga</a>';
			  }	
			  listalog.setLineItemValue('custpage_lmry_rg_trandate',	row, searchresult.getValue('created'));
			  listalog.setLineItemValue('custpage_lmry_rg_transaction', row, searchresult.getValue('custrecord_lmry_pe_corp_2016_transaction'));
			  listalog.setLineItemValue('custpage_lmry_rg_postingperiod', row, periodname);
			  listalog.setLineItemValue('custpage_lmry_rg_subsidiary',  row, searchresult.getValue('custrecord_lmry_pe_corp_2016_subsidiary'));
			  listalog.setLineItemValue('custpage_lmry_rg_employee', 	row, searchresult.getValue('custrecord_lmry_pe_corp_2016_employee'));
			  listalog.setLineItemValue('custpage_lmry_rg_nombre', 		row, searchresult.getValue('custrecord_lmry_pe_corp_2016_name'));
			  listalog.setLineItemValue('custpage_lmry_rg_archivo', 	row, linktext);
			}
			
			// Botones del formulario
			form.addSubmitButton('Generar');
			form.addResetButton('Cancelar');
			form.setScript("customscript_lmry_pe_2016_corp_rpt_clnt");
	
			// Crea el formulario
			response.writePage(form);
		} else {
			//Valida si es OneWorld
			var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');

			/*********************************************
			 * Regista en el log de generacion de archivos
			 ********************************************/
			
			// Nombre del reporte
			var TituloInforme = nlapiLookupField('customrecord_lmry_pe_corp_2016_features', request.getParameter('custpage_lmry_2016_reporte'), 'name');
			// Nombre Empleado
			var employeename  = nlapiLookupField('employee', nlapiGetUser(), ['firstname', 'lastname']);
				employeename  = employeename.firstname + ' ' + employeename.lastname;
			// Nombre del periodo
			var periodname    = nlapiLookupField('accountingperiod', request.getParameter('custpage_periodo_2016'), 'periodname');
			// Creacion de la linea en el log de errores
			var record = nlapiCreateRecord('customrecord_lmry_pe_corp_2016_gener_log');
				record.setFieldValue('custrecord_lmry_pe_corp_2016_name', 'Pendiente');
				record.setFieldValue('custrecord_lmry_pe_corp_2016_transaction', TituloInforme );
				record.setFieldValue('custrecord_lmry_pe_corp_2016_postingperi', periodname);
				if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
				{
					// Trae el nombre de la subsidiaria
					var subsidiary = nlapiLookupField('subsidiary', request.getParameter('custpage_2016_subsidiary'), 'name');
					record.setFieldValue('custrecord_lmry_pe_corp_2016_subsidiary', subsidiary);
				}
				record.setFieldValue('custrecord_lmry_pe_corp_2016_url_file', '');
				record.setFieldValue('custrecord_lmry_pe_corp_2016_employee', employeename );
			var rec_id = nlapiSubmitRecord(record, true);

			/*********************************************
			 * Pasa los parametros para los reportes
			 ********************************************/

			// Parametros del reporte
			var params = new Array();
				// Libro Diario 2016
				params['custscript_lmry_2016_corp_ld_period'] = request.getParameter('custpage_periodo_2016');
				params['custscript_lmry_2016_corp_ld_log_id']  = rec_id;
				params['custscript_lmry_2016_corp_ld_inshea'] = request.getParameter('custpage_insert_head_2016');
				if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
				{
					params['custscript_lmry_2016_corp_ld_subsid'] = request.getParameter('custpage_2016_subsidiary');
				}
				// Estatus del Schedule
				var status = '';

				// Reporte seleccionado
				var idrpts = request.getParameter('custpage_lmry_2016_reporte');
				if ( idrpts==1 ){
					// Libro Diario 
					params['custscript_lmry_2016_corp_ld_showli'] = false;
					params['custscript_lmry_2016_corp_ld_prefij'] = 'DA';
			    	params['custscript_lmry_2016_corp_ld_search'] = 'customsearch_lmry_pe2016_dia_may_01_coa';
					status = nlapiScheduleScript('customscript_lmry_pe_2016_corp_dia_schdl', 'customdeploy_lmry_pe_2016_corp_dia1schdl', params);
			    	
					// Libro Diario - Payment
					params['custscript_lmry_2016_corp_ld_log_id']  = 0;
					params['custscript_lmry_2016_corp_ld_showli'] = true;
			    	params['custscript_lmry_2016_corp_ld_prefij'] = 'DB';
			    	params['custscript_lmry_2016_corp_ld_search'] = 'customsearch_lmry_pe2016_dia_may_02_coa';
			    	status = nlapiScheduleScript('customscript_lmry_pe_2016_corp_dia_schdl', 'customdeploy_lmry_pe_2016_corp_dia2schdl', params);
			    	
			    	// Plan de Cuentas
			    	params['custscript_lmry_2016_corp_pcta_period'] = request.getParameter('custpage_periodo_2016');
			    	params['custscript_lmry_2016_corp_pcta_inshea'] = request.getParameter('custpage_insert_head_2016');
					if (featuresubs == true || featuresubs == 'T') {
						params['custscript_lmry_2016_corp_pcta_subsid'] = request.getParameter('custpage_2016_subsidiary');
					}
			    	status = nlapiScheduleScript('customscript_lmry_pe_2016_corp_cta_schdl', 'customdeploy_lmry_pe_2016_corp_cta_schdl', params);
				}

				// Libro Mayor 2016
				params['custscript_lmry_2016_corp_lm_period'] = request.getParameter('custpage_periodo_2016');
				params['custscript_lmry_2016_corp_lm_log_id']  = rec_id;
				params['custscript_lmry_2016_corp_lm_inshea'] = request.getParameter('custpage_insert_head_2016');
				if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
				{
					params['custscript_lmry_2016_corp_lm_subsid'] = request.getParameter('custpage_2016_subsidiary');
				}
				if ( idrpts==2 ){
					// Libro Mayor 
					params['custscript_lmry_2016_corp_lm_showli'] = false;
					params['custscript_lmry_2016_corp_lm_prefij'] = 'MA';
			    	params['custscript_lmry_2016_corp_lm_search'] = 'customsearch_lmry_pe2016_dia_may_01_coa';
					status = nlapiScheduleScript('customscript_lmry_pe_2016_corp_may_schdl', 'customdeploy_lmry_pe_2016_corp_may1schdl', params);
			    	
					// Libro Mayor - Payment
					params['custscript_lmry_2016_corp_lm_log_id']  = 0;
					params['custscript_lmry_2016_corp_lm_showli'] = true;
			    	params['custscript_lmry_2016_corp_lm_prefij'] = 'MB';
			    	params['custscript_lmry_2016_corp_lm_search'] = 'customsearch_lmry_pe2016_dia_may_02_coa';
			    	status = nlapiScheduleScript('customscript_lmry_pe_2016_corp_may_schdl', 'customdeploy_lmry_pe_2016_corp_may2schdl', params);
				}

			// Valida si esta ejecutanto el schedule lanzado
			if (status!='QUEUED'){
				// Finalizado
				nlapiSubmitField('customrecord_lmry_pe_corp_2016_gener_log', idrpts, 
								['custrecord_lmry_pe_corp_2016_name'], 
								['No puede realizar el reporte mientras exista un proceso pendiente en otro periodo.']);
			}
			
			// Redireccion el script, vuelve a llamar al SuiteLet actual
			nlapiSetRedirectURL('SUITELET',nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
		}
	// Control de Errores try
	} catch(err) {
		sendemail(err, LMRY_script);
	}
	return true;
}

/* ------------------------------------------------------------------------------------------------------ 
 * Nota: Valida si existe el folder donde se guardaran los archivos 
 * --------------------------------------------------------------------------------------------------- */
function search_folder() {
	try {
		// Ruta de la carpeta contenedora
		var FolderId = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_2016_cor_file_cabinet');
		if ( FolderId=='' || FolderId==null ) {

			// Valida si existe "SuiteLatamReady" en File Cabinet 
			var SubOf = '';
			var ResultSet = nlapiSearchRecord('folder', null
					, new nlobjSearchFilter('name', null, 'is', 'SuiteLatamReady')
					, new nlobjSearchColumn('internalid') );
			if ( ResultSet=='' || ResultSet==null) {
				var folder = nlapiCreateRecord('folder');
					folder.setFieldValue('name', 'SuiteLatamReady');
				SubOf = nlapiSubmitRecord(folder,true);
			} else {
				SubOf = ResultSet[0].getValue('internalid');
			}

			// Valida si existe "LMRY Report Generator" en File Cabinet
			var FolderId = '';
			var ResultSet = nlapiSearchRecord('folder', null
					, new nlobjSearchFilter('name', null, 'is', 'Latam Report Generator PE 2016 Corp')
					, new nlobjSearchColumn('internalid') );
			if ( ResultSet=='' || ResultSet==null) {

				// Crea la carpeta
				var folder = nlapiCreateRecord('folder');
					folder.setFieldValue('name', 'Latam Report Generator PE 2016 Corp');
					folder.setFieldValue('parent', SubOf);
				FolderId = nlapiSubmitRecord(folder,true);
			} else {
				FolderId = ResultSet[0].getValue('internalid');
			}
			// Load the NetSuite Company Preferences page
			var company = nlapiLoadConfiguration('companypreferences'); 
				// set field values
				company.setFieldValue('custscript_lmry_pe_2016_cor_file_cabinet', FolderId);
			// save changes to the Company Preferences page
			nlapiSubmitConfiguration( company );		
		}
	} catch(err){
		// Mail de configuracion del folder
		sendemail(err, LMRY_script);
	}
	return true;
}