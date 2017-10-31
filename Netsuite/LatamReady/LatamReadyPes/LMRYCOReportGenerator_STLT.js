/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 sep 2014     LatamReady Consultor
 * File : LMRYReportGeneratorCO_STLT.js
 */
var objContext = nlapiGetContext();
// Titulo del Suitelet
var namereport = "Latam Report Generator CO";
var LMRY_script = "LMRY Report Generator CO STLT";
var ArrPeriodos = new Array();

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_main_co(request, response){
	try {
		// Crea el folder
		search_folder();
		
		if ( request.getMethod() == 'GET' ) {
			var form = nlapiCreateForm(namereport);

			/* ****** Grupo de Campos Criterios de Busqueda ****** */
			var group = form.addFieldGroup('custpage_filran1', 'Tipos de Reporte');
			
			//Obtiene los datos de la lista de reportes SUNAT
			var fieldreports = form.addField('custpage_lmry_reporte', 'select', 'Reporte', null, 'custpage_filran1');
				var columns = new Array();
					columns[0] = new nlobjSearchColumn('internalid');
					columns[1] = new nlobjSearchColumn('name');
				var searchctalt = nlapiSearchRecord('customrecord_lmry_co_features', null, filters, columns);   
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
			var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
			if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
			{
				var fieldsubs = form.addField('custpage_subsidiary', 'select', 'Subsidiaria', null, 'custpage_filran2');
					// Filtros
					var filters = new Array();
						filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
						filters[1] = new nlobjSearchFilter('country', null, 'is', 'CO'); 	// Subsidiary for Country
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
				columns[0] = new nlobjSearchColumn('custrecord_lmry_co_filter_id');
				columns[1] = new nlobjSearchColumn('custrecord_lmry_co_filter_field_type'); 
				columns[2] = new nlobjSearchColumn('custrecord_lmry_co_filter_field_label');
				columns[3] = new nlobjSearchColumn('custrecord_lmry_co_filter_list_record');
				columns[4] = new nlobjSearchColumn('custrecord_lmry_co_filter_field_help');	
				columns[5] = new nlobjSearchColumn('custrecord_lmry_co_filter_field_mandator');
			
			//
			var transacdata = nlapiSearchRecord('customrecord_lmry_co_filter_report', 'customsearch_lmry_co_filter_report', null, columns);
			var auxfield = '';
			for(var i = 0; i < transacdata.length; i++){
				var idField 	= transacdata[i].getValue('custrecord_lmry_co_filter_id');
				var tipoField	= transacdata[i].getValue('custrecord_lmry_co_filter_field_type');
				var lblField	= transacdata[i].getValue('custrecord_lmry_co_filter_field_label');
				var listaRec	= transacdata[i].getValue('custrecord_lmry_co_filter_list_record');
				if (listaRec=='') { listaRec=null; }
				var ayudaField	= transacdata[i].getValue('custrecord_lmry_co_filter_field_help');
				var mandatory	= transacdata[i].getValue('custrecord_lmry_co_filter_field_mandator');
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
					"<div style=\"color: gray; font-size: 8pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Important: By using the NetSuite, you assume all responsibility for determining whether the data you generate and download is accurate or sufficient for your purposes. You also assume all responsibility for the security of any data that you download from NetSuite and subsequently store outside of the NetSuite system.</div>" +
					"</td>" +
					"</tr>" +
					"</table>" +
					"</html>";
			myInlineHtml.setDefaultValue(strhtml);		
			
			form.addTab('custpage_maintab', 'Tab');
			//sublista				
			var listalog = form.addSubList('custpage_sublista','staticlist','Log de generacion','custpage_maintab');
				listalog.addField('custoage_lmry_rg_trandate','text','Fecha de creacion').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_transaction', 'text', 'Informe').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_postingperiod', 'text', 'Periodo').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_subsidiary', 'text', 'Subsidiaria').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_employee', 'text', 'Creado por').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_nombre', 'text', 'Nombre archivo').setDisplayType("disabled");
				listalog.addField('custpage_lmry_rg_archivo', 'text', 'Descargar').setDisplayType("normal");
				listalog.addRefreshButton();
					
			// the records to be displayed are from a saved search
			var s = nlapiLoadSearch('customrecord_lmry_co_rpt_generator_log', 'customsearch_lmry_co_rpt_generator_log');
			var resultSet = s.runSearch();
	
			// only display rows from the search result that matches the value in the drop down
			var results = resultSet.getResults(0, 1000);
			for ( var i = 0; results != null && i < results.length; i++) 
			{
			  var row = i + 1;
			  searchresult = results[i];
		
			  var periodname = searchresult.getValue('custrecord_lmry_co_rg_postingperiod');
			  var linktext = '';
			  var url = searchresult.getValue('custrecord_lmry_co_rg_url_file');
			  if (url!=null && url!='') {
				  linktext = '<a target="_blank" href="'+searchresult.getValue('custrecord_lmry_co_rg_url_file')+'">Descarga</a>';
			  }	
			  listalog.setLineItemValue('custoage_lmry_rg_trandate',	row, searchresult.getValue('created'));
			  listalog.setLineItemValue('custpage_lmry_rg_transaction', row, searchresult.getValue('custrecord_lmry_co_rg_transaction'));
			  listalog.setLineItemValue('custpage_lmry_rg_postingperiod', row, periodname);
			  listalog.setLineItemValue('custpage_lmry_rg_subsidiary',  row, searchresult.getValue('custrecord_lmry_co_rg_subsidiary'));
			  listalog.setLineItemValue('custpage_lmry_rg_employee', 	row, searchresult.getValue('custrecord_lmry_co_rg_employee'));
			  listalog.setLineItemValue('custpage_lmry_rg_nombre', 		row, searchresult.getValue('custrecord_lmry_co_rg_name'));
			  listalog.setLineItemValue('custpage_lmry_rg_archivo', 	row, linktext);
			}
			// Botones del formulario
			form.addSubmitButton('Generar');
			form.addResetButton('Cancelar');
			form.setScript("customscript_lmry_rep_generator_co_clnt");
	
			// Crea el formulario
			response.writePage(form);
		}
		else
		{
			//Valida si es OneWorld
			var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
			var params = new Array();
			
			// Ejecuta el Shedule
			var idrpts = request.getParameter('custpage_lmry_reporte');
			var report = nlapiLookupField('customrecord_lmry_co_features', idrpts, ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy','name']);
			TituloInforme =  report.name;
			var rec_id = '';
			
			// Creacion de la linea en el log de errores
			var record = nlapiCreateRecord('customrecord_lmry_co_rpt_generator_log');
					record.setFieldValue('custrecord_lmry_co_rg_name', 'Pendiente');
					record.setFieldValue('custrecord_lmry_co_rg_transaction', TituloInforme );
					record.setFieldValue('custrecord_lmry_co_rg_postingperiod', '');
					record.setFieldValue('custrecord_lmry_co_rg_subsidiary', '');
					record.setFieldValue('custrecord_lmry_co_rg_url_file', '');
					record.setFieldValue('custrecord_lmry_co_rg_employee', nlapiGetUser() );
			rec_id = nlapiSubmitRecord(record, true);
			
			// Reporte Libro de Inventario y Balance
	    	params['custscript_lmry_periodo_invbalance'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_invbalance'] = rec_id;
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_invbalance'] = request.getParameter('custpage_subsidiary');
			}
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_booking_invbalan'] = request.getParameter('custpage_multibook');
			}
			
			// Reporte Libro Diario
			if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_librodiarioco'] = request.getParameter('custpage_subsidiary');
			}
			params['custscript_lmry_periodo_librodiarioco'] = request.getParameter('custpage_periodo');
			params['custscript_lmry_idrpt_librodiarioco'] = rec_id;
			/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibook_librodiarioco'] = request.getParameter('custpage_multibook');
			}
			
	    	// Reporte Libro Diario sin cierre
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_librodiariocie'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_librodiariocie'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_librodiariocie'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_booking_librodiariocie'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Libro Mayor y Balance
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_mayorbalance'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_mayorbalance'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_mayorbalance'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooking_mayorbalanc'] = request.getParameter('custpage_multibook');
			}
			
					
	    	// Reporte Form 1006 Impuesto a las ventas
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_form1006_sub'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_form1006_per'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_form1006_rpt'] = rec_id;
	    	
	    	
	    	// Reporte Form 1012 Declaraciones Tributarias
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1012'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1012'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1012'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_mulltibooking_form1012'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Form 1012 Declaraciones Tributarias - anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1012anual'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1012anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1012anual'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooki_form1012anual'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Form 1009 Saldo de Cuentas por Pagar
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1009'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1009'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1009'] = rec_id;
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_mukltibooking_form1009'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Form 1009 Saldo de Cuentas por Pagar - anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1009anual'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1009anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1009anual'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooki_form1009anual'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Form 1008 Saldo de Cuentas por Cobrar
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1008'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1008'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1008'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooking_form1008'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Form 1008 Saldo de Cuentas por Cobrar - anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1008anual'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1008anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1008anual'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooki_form1008anual'] = request.getParameter('custpage_multibook');
			}	    	
	    	// Reporte Form 1007 Ingresos Recibidos
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1007'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1007'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1007'] = rec_id;
	    	
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooki_form1007anual'] = request.getParameter('custpage_multibook');
			}
	    	
	    	
	    	// Reporte Form 1007 Ingresos Recibidos - anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1007anual'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1007anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1007anual'] = rec_id;
	    	
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_booking_form1007anual'] = request.getParameter('custpage_multibook');
			}
	    	
	    	// Reporte Form 1006 Impuesto a las ventas por pagar
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1006'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1006'] = request.getParameter('custpage_anio');
	    	params['custscript_lmry_idrpt_form1006'] = rec_id;
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_form1006_multibooking'] = request.getParameter('custpage_multibook');
			}
	    	
	    	
	    	// Reporte Form 1006 Impuesto a las ventas por pagar - Anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_form1006anual_subs'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_form1006anual_peri'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_form1006anual_idrp'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_form1006anual_multibooki'] = request.getParameter('custpage_multibook');
			}
	    	
	    	
	    	// Reporte Form 1001 Pagos o abonos en cuenta y retenciones practicadas
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1001'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1001'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1001'] = rec_id;
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooking_form1001'] = request.getParameter('custpage_multibook');
			}
	    	
	    	// Reporte Form 1001 Pagos o abonos en cuenta y retenciones practicadas - Anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1001anual'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1001anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1001anual'] = rec_id;
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooking_form1001anu'] = request.getParameter('custpage_multibook');
			}
	    	
	    	// Reporte Form 1003 Retenciones en la fuente que le practicaron
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1003'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1003'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1003'] = rec_id;
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooking_form1003'] = request.getParameter('custpage_multibook');
			}
	    	
	    	// Reporte Form 1003 Retenciones en la fuente que le practicaron - Anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_booking_form1003'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1003anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1003anual'] = rec_id;	    	
	    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooki_form1003anual'] = request.getParameter('custpage_multibook');
			}
	    	
	    	// Reporte Form 1005 Impuesto a las ventas por pagar (Descontable)
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1005'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_periodo_form1005'] = request.getParameter('custpage_periodo');
	    	params['custscript_lmry_idrpt_form1005'] = rec_id;

	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooking_form1005'] = request.getParameter('custpage_multibook');
			}
	    	
	    	
	    	// Reporte Form 1005 Impuesto a las ventas por pagar (Descontable) - Anual
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_form1005anual'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_anio_form1005anual'] = request.getParameter('custpage_txtanio');
	    	params['custscript_lmry_idrpt_form1005anual'] = rec_id;		    	
	    	/* ***********************************************************************************
			 * 2017/01/27 Verifica si esta activo la funcionalidad: Multibook - accountingbook
			 * **********************************************************************************/
			var Multibook = objContext.getFeature('multibook')
			if (Multibook==true || Multibook=='T'){
				params['custscript_lmry_multibooki_form1005anual'] = request.getParameter('custpage_multibook');
			}
	    	// Reporte Certificado de Retencion
	    	if (featuresubs == true || featuresubs == 'T') {
				params['custscript_lmry_subsidi_certreten'] = request.getParameter('custpage_subsidiary');
			}
	    	params['custscript_lmry_pinicio_certreten'] = request.getParameter('custpage_lmry_cr_fechaini');
	    	params['custscript_lmry_pfinal_certreten'] = request.getParameter('custpage_lmry_cr_fechafin');
	    	params['custscript_lmry_vendor_certreten'] = request.getParameter('custpage_lmry_cr_vendor');
	    	params['custscript_lmry_treten_certreten'] = request.getParameter('custpage_tipo_retencion');
	    	params['custscript_lmry_idrpt_certreten'] = rec_id;
	    	
	    	var idrpts = request.getParameter('custpage_lmry_reporte');
			var report = nlapiLookupField('customrecord_lmry_co_features', idrpts, ['custrecord_lmry_co_id_schedule', 'custrecord_lmry_co_id_deploy']);
			var status = nlapiScheduleScript(report.custrecord_lmry_co_id_schedule, report.custrecord_lmry_co_id_deploy, params);
			
			// Redireccion el script, vuelve a llamar al SuiteLet actual
			nlapiSetRedirectURL('SUITELET',nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
		}
	} catch(err) {
		sendemail(err, LMRY_script);
	}
	return true;
}

function ObtenerPeriodoContablexAnio(pAnio)
{
	// Control de Memoria
	var arrAuxiliar = new Array();
	var _cont = 0;
	var DbolStop = false;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('formulatext', null,  'is', pAnio);
        filters[0].setFormula("TO_CHAR({startdate},'yyyy')");
	
	var objResult = nlapiSearchRecord('accountingperiod', 'customsearch_lmry_idaccountingperiod',filters);

	while(!DbolStop)	{
	
	if (objResult != null)
		{
			var intLength = objResult.length;
			
			for(var i = 0; i < intLength; i++)
			 {
				columns = objResult[i].getAllColumns();
				arrAuxiliar= new Array();
				
				//0. Internal Id
				if (objResult[i].getValue(columns[0])!=null)
					arrAuxiliar[0] = objResult[i].getValue(columns[0]) ;	
				else
					arrAuxiliar[0] = '';
				
				ArrPeriodos[_cont] = arrAuxiliar;
				_cont++;
			 
			 } 
			 if (intLength<1000){
				 DbolStop = true;
			 }
		}
		else
		{ DbolStop = true;}
	}
}
/* ------------------------------------------------------------------------------------------------------ 
 * Nota: Valida si existe el folder donde se guardaran los archivos 
 * --------------------------------------------------------------------------------------------------- */
function search_folder() {
	try {
		// Ruta de la carpeta contenedora
		var FolderId = objContext.getSetting('SCRIPT', 'custscript_lmry_file_cabinet_rg_co');
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
					, new nlobjSearchFilter('name', null, 'is', 'Latam Report Generator CO')
					, new nlobjSearchColumn('internalid') );
			if ( ResultSet=='' || ResultSet==null) {

				// Crea la carpeta
				var folder = nlapiCreateRecord('folder');
					folder.setFieldValue('name', 'Latam Report Generator CO');
					folder.setFieldValue('parent', SubOf);
				FolderId = nlapiSubmitRecord(folder,true);
			} else {
				FolderId = ResultSet[0].getValue('internalid');
			}
			// Load the NetSuite Company Preferences page
			var company = nlapiLoadConfiguration('companypreferences'); 
				// set field values
				company.setFieldValue('custscript_lmry_file_cabinet_rg_co', FolderId);
			// save changes to the Company Preferences page
			nlapiSubmitConfiguration( company );		
		}
	} catch(err){
		// Mail de configuracion del folder
		sendemail(err, LMRY_script);
	}
	return true;
}