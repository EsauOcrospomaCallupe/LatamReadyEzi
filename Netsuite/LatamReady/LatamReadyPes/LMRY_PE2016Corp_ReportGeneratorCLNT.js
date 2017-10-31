/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 jul 2015     LatamReady Consultor
 * File : LMRY_PE2016Corp_ReportGeneratorCLNT.js
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
				filters[0] = new nlobjSearchFilter('custrecord_lmry_pe_cor_2016_filter_featu', null, 'anyof', reporteSunat);
			var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filter_id');		
			var transacdata = nlapiSearchRecord('customrecord_lmry_pe_corp_2016_filt_rept', null, filters, columns);
			if (transacdata!=null && transacdata!='') 
			{
				for(var i = 0; i < transacdata.length; i++) 
				{
					var idField = transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filter_id');
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
	return true;
}

function ocultaCampos() {
	var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_lmry_pe_cor_2016_filter_custp');		

	var transacdata = nlapiSearchRecord('customrecord_lmry_pe_corp_2016_filt_rept', 'customsearch_lmry_pe_corp_2016_filt_rept', null, columns);
	if (transacdata!=null && transacdata!='') 
	{
		var auxfield = '';
		for(var i = 0; i < transacdata.length; i++) 
		{
			var idField = transacdata[i].getValue('custrecord_lmry_pe_cor_2016_filter_custp');
			if ( auxfield!= idField && idField!=null && idField!='' ) 
			{
				auxfield = idField;
				// Oculta el campo
				nlapiSetFieldDisplay(idField, false );
			}
		}
	}
}