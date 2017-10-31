/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 jul 2015     LatamReady Consultor
 * File : LMRYReportGeneratorPE2016_CLNT.js
 */
var objContext = nlapiGetContext();
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function onloadForm(type){
	if(nlapiGetFieldValue('custpage_lmry_reporte')=='') {
		ocultaCampos();
	}	
}

function clientSaveRecord()
{	
	try
	{
		// Valida si tiene la licencia activa
		var featureId   = nlapiGetFieldValue('custpage_lmry_reporte');

		//Reporte de Certificado de Retencion - Colombia
		if (featureId==60)
		{
			var granted     = getAuthorization(featureId);			
			if (!granted) {
				alert('No tiene acceso a este reporte. \n\nVerifique su acceso con el Administrador.');
				return false;
			}
			
		}
		
		// Mesaje al usuario
		alert('Se generara un archivo y se enviara un mail con la confirmacion del proceso.\n\nEste proceso puede durar varios minutos.\n\nPor favor actualizar el log para su descarga.');
		return true;
	}catch(err){
		sendemail(' [ clientSaveRecord ] ' + err, LMRY_script);
		
		return false;		
	}
}

function clientFieldValidate(type, name, linenum)
{
	try
	{	
		if(name=='custpage_lmry_reporte') 
		{
			ocultaCampos();
			
			var reporteSunat = nlapiGetFieldValue('custpage_lmry_reporte');
			
			if (reporteSunat=='' || reporteSunat==null) { return true; }
			
			// Registro personalizado de camposa ocular en el SuiteLet
			var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_lmry_pe_2016_filter_features', null, 'anyof', reporteSunat);
			var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_lmry_pe_2016_filter_id');		
			var transacdata = nlapiSearchRecord('customrecord_lmry_pe_2016_filter_report', null, filters, columns);
			if (transacdata!=null && transacdata!='') 
			{
				for(var i = 0; i < transacdata.length; i++) 
				{
					var idField = transacdata[i].getValue('custrecord_lmry_pe_2016_filter_id');
					// Obteniendo datos de etiqueta y campo de ingreso
					if (idField!=null && idField!='') {
						nlapiSetFieldDisplay(idField, true );
					}
				}
			}
			return true;
		}
	}catch(err){
		sendemail(' [ clientFieldValidate ] ' + err, LMRY_script);
		
		return false;		
	}
	return true;
}

function clientFieldChanged(type, name, linenum) 
{
	//Solo para Reporte de Balanza de Comprobacion
	if (name=='custpage_tipo_medio')
	{
		if (nlapiGetFieldValue('custpage_tipo_medio')=='1')
		{ nlapiSetFieldDisplay('custpage_date_proceso', false ); }
		else
		{ nlapiSetFieldDisplay('custpage_date_proceso', true ); }
	}
		
	//Solo para Reporte de Poliza
	if (name=='custpage_tipo_solicitud')
	{
		if (nlapiGetFieldValue('custpage_tipo_solicitud')=='1' || nlapiGetFieldValue('custpage_tipo_solicitud')=='2')
			{ 
			  nlapiSetFieldDisplay('custpage_num_orden', true );
			  nlapiSetFieldDisplay('custpage_num_tramite', false );
			}
		else
			{
			  nlapiSetFieldDisplay('custpage_num_orden', false );
			  nlapiSetFieldDisplay('custpage_num_tramite', true );
			}
	}
	
	return true;
}

function ocultaCampos() {
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_lmry_pe_2016_filter_custpage');		

	var transacdata = nlapiSearchRecord('customrecord_lmry_pe_2016_filter_report', 'customsearch_lmry_pe_2016_filter_report', null, columns);
	if (transacdata!=null && transacdata!='') 
	{
		var auxfield = '';
		for(var i = 0; i < transacdata.length; i++) 
		{
			var idField = transacdata[i].getValue('custrecord_lmry_pe_2016_filter_custpage');
			if ( auxfield!= idField && idField!=null && idField!='' ) 
			{
				auxfield = idField;
				// Oculta el campo
				nlapiSetFieldDisplay(idField, false );
			}
		}
	}
}