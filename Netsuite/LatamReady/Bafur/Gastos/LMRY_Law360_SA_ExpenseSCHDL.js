/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Ene 2017     LatamReady Consultor
 * File : LMRY_Law360_SA_ExpenseSCHDL.js
 */
// Nombre del Script
// Recuperamos valores
var objContext = nlapiGetContext(); 
var LMRY_script = "LatamReady - Law360 SA Expense SCHDL";
var opcApprobe  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_app');
var opcReject   = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_rej');
var employeeid  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_emp');
var createinvo  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_create');
// Arreglo para la facturacion
var arrTimes = new Array();
var arrPosic = 0;
// Empieza el proceso del Schedule
function SAE_main_schedule()
{
	try {		
		// Log de Errores
		nlapiLogExecution('ERROR', 'SAE_main_schedule, createinvo -> ', 'Proceso Iniciado... - ' + createinvo);		
		
		/*********************************************************
		 * Registro Personalizado : LatamReady - Law360 Expense
		 ********************************************************/ 
		
		/*
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');								//6
			columns[1] = new nlobjSearchColumn('custrecord_lmry_law360_expens_accsta');		// 7	Latam - Law360 Account State
			columns[2] = new nlobjSearchColumn('custrecord_lmry_law360_expens_type');		// 8Latam - Law360 Type Transaction
			columns[3] = new nlobjSearchColumn('custrecord_lmry_law360_expens_intern');		// 9Latam - Law360 Internal ID
			columns[4] = new nlobjSearchColumn('custrecord_lmry_law360_expens_secuen');		// 10Latam - Law360 Secuence Line
			columns[5] = new nlobjSearchColumn('custrecord_lmry_law360_expens_project');	// 11Latam - Law360 Project
			columns[6] = new nlobjSearchColumn('custrecord_lmry_law360_expens_period');		// 12Latam - Law360 Period
			columns[7] = new nlobjSearchColumn('custrecord_lmry_law360_expens_langua');		// 13Latam - Law360 Language
			columns[8] = new nlobjSearchColumn('custrecord_lmry_law360_saccexpe_state', 'custrecord_lmry_law360_expens_accsta');//14
			columns[9] = new nlobjSearchColumn('customer', 'custrecord_lmry_law360_expens_project');//15
			columns[10] = new nlobjSearchColumn('custrecord_lmry_law360_expens_jobcurrenc');	// Latam - Law360 Job Currency
			columns[11]= columns[1].setSort();
			columns[12]= columns[2].setSort();
		*/

		// Ejecuta la busqueda
		var objResultSearch = nlapiLoadSearch('customrecord_lmry_law360_expense','customsearch_lmry_law360_state_acc_exp_2');	
		var busquedaResult	= objResultSearch.runSearch();
		var objResult	= busquedaResult.getResults(0, 100);
		

		if (objResult!='' && objResult!=null)
		{
			if (objResult.length>0)
			{
				// Log de Errores
				nlapiLogExecution('ERROR', 'customrecord_lmry_law360_expense: length -> ', objResult.length);

				
				// Procesa la busqueda consultada
				var fil = 0;
				while ( fil<objResult.length )
				{
					var columnsDetalle	=	objResult[fil].getAllColumns();
					var monto=0.00;
					// Estado de cuenta a Procesar
					var recordID = objResult[fil].getValue(columnsDetalle[7]);
					var reestado = objResult[fil].getValue(columnsDetalle[14]);
					var languaj  = objResult[fil].getValue(columnsDetalle[13]);
					var TranID   = 0;
					var pstatus  = 0;
					var buttomID = 0;
					var pmensaje = '';
					var sendmail = false;
					if (reestado=='Aprobacion Pendiente'){
						buttomID = 1;
						pstatus = opcApprobe;
						pmensaje= 'Aprobado';
					}else{
						buttomID = 2;
						pstatus = opcReject;
						pmensaje= 'Rechazado';
					}

					// LatamReady - Law360  State Account Time
					var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_expen', 
									recordID, 
									'custrecord_lmry_law360_saccexpe_state', 
									'Se esta procesando ...');

					// Se procesa el estado de cuenta
					while ( recordID == objResult[fil].getValue(columnsDetalle[7]) )
					{
						var pasunto	   = objResult[fil].getValue(columnsDetalle[11]); 
						var periodo    = objResult[fil].getValue(columnsDetalle[12]); 

						var CustRecoID = objResult[fil].getValue(columnsDetalle[6]);
						var InternalID = objResult[fil].getValue(columnsDetalle[9]);
						var SecuenciID = objResult[fil].getValue(columnsDetalle[10]);
						if (InternalID!=null && InternalID!=''){
							var cresult1 = nlapiSubmitField('customrecord_lmry_law360_expense', CustRecoID, 'custrecord_lmry_law360_expens_cusapp', pstatus);
							
							//proceso acumulador de importes
							var importe       =	objResult[fil].getValue(columnsDetalle[4]);
							monto=monto+importe;							
							
							// Envio de mail
							sendmail = true;						
						}
						
						// Siguiente Registro
						fil++;

						// Ultima linea
						if (fil==objResult.length){ break; }
					} // Se procesa el estado de cuenta

					// Envio de mail
					if (sendmail==true) {
						// Crea la factura si esta aprobado y activo el feature crear factura
						if ( pmensaje== 'Aprobado' && (createinvo=='T' || createinvo==true) )
						{
							var idinvoice = law360_invoice(arrTimes);
							
							// LatamReady - Law360 State Account Expens
							if (idinvoice!=0)
							{
								var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_expen', 
												recordID, 
												'custrecord_lmry_law360_saccexpe_invoice',  idinvoice);
							}
						}
						// LatamReady - Law360  State Account Time
						var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_expen', 
										recordID, 
										['custrecord_lmry_law360_saccexpe_state', 'custrecord_lmry_law360_saccexpe_sched'], 
										[pmensaje, 'F'] );

						// Envio de Coreeo : Subsidiaria , usuario , periodo
						law360_sendcustomer(buttomID, pasunto, periodo, languaj);

						// Unidades de memoria disponible
						var unimemory = objContext.getRemainingUsage();
						
						// Log de Errores
						nlapiLogExecution('ERROR', 'pasunto , periodo , unimemory -> ', pasunto + ' , ' + periodo + ' , ' + unimemory);
					} // Envio de mail
				} // Procesa la busqueda consultada

				if(objResult.length==1000){
					var objResult	= busquedaResult.getResults(1000, 1100);
				}
			}
		} // Ejecuta la busqueda
		
		// Log de Errores
		nlapiLogExecution('ERROR', 'SAE_main_schedule -> ', 'Proceso Terminado...');
 	}catch(err){		
		// Envia correo de error al usuario
		law360_sendemail(err + ' [SAE_main_schedule]', LMRY_script);		
	}
}

/* ------------------------------------------------------------------------------------------------------
 * Funcion para crear la factura de un estado de cuenta de tiempos
 * --------------------------------------------------------------------------------------------------- */
function law360_invoice(montoTot)
{	
	try
	{
		var invoice_entity  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_item');
		var invoice_item  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_item');
		var invoice_taxc  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_taxcode');
		var invoice_loca  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_location');
		var idRecord = 0;

		// Valida que este configurado para la generacion de factura
		if (invoice_item=='' || invoice_item==null || invoice_taxc=='' || invoice_taxc==null){
			// Log de Errores
			nlapiLogExecution('ERROR', 'law360_invoice - Falta configurar parametros-> ', invoice_item + ' , ' + invoice_taxc);
			
			// Termina la funcion
			return idRecord;
		}
		// Se optiene el valore del tipo de documento Sunat, en la ficha del cliente
		var tipodocu = nlapiLookupField('customer', invoice_entity, 'custentity_tipo_doc_id_sunat');
	
		var DocuTipo = '';
		var DocuSeri = '';
		if (tipodocu!='' && tipodocu!='')
		{
			/******************************************************
			 * Busca su equivalencia en el registro persibalizado : 
			 * 		 LatamReady - Law360 Invoice Config 
			 *****************************************************/ 
			// Filtros
			var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_lmry_law360_invoice_doctyp', null, 'anyof', tipodocu);
			// Resultados
			var columns = new Array();
				columns[0] = new nlobjSearchColumn('custrecord_lmry_law360_invoice_docfis');
				columns[1] = new nlobjSearchColumn('custrecord_lmry_law360_invoice_sernum');
			// Ejecuta la busqueda  
			var cResult = nlapiSearchRecord('customrecord_lmry_law360_invoice_config', null, filters, columns);	
			if (cResult != null && cResult != '')
			{ 
				var intLength = cResult.length;
				if (intLength>0)
				{
					// Coloca los correo en un arreglo
					DocuTipo = cResult[0].getValue(columns[0]);
					DocuSeri = cResult[0].getValue(columns[1]);
				}
			}
		}

		/**********************************************
		 * Crea el nuevo invoice - temporal para luego
		 * poder facturar los tiempos.
		 *********************************************/ 
		var NewRecord = nlapiCreateRecord('invoice');
			NewRecord.setFieldValue('entity', invoice_entity);		// Cliente
			
			NewRecord.setFieldValue('location', invoice_loca) 	// Ubicacion
			// Pupulado de campoas para la FE
			NewRecord.setFieldValue('custbody_lmry_document_type', DocuTipo);		// Latam - Legal Document Type
			NewRecord.setFieldValue('custbody_lmry_serie_doc_cxc', DocuSeri);		// Latam - Serie CxC

			// Agrega el registro
			NewRecord.setLineItemValue('item', 'quantity'	, 1, 1);
			NewRecord.setLineItemValue('item', 'item'		, 1, invoice_item);
			NewRecord.setLineItemValue('item', 'price'		, 1, -1); // Custom
			NewRecord.setLineItemValue('item', 'rate'		, 1, montoTot);//total de los importes
			NewRecord.setLineItemValue('item', 'taxcode'	, 1, invoice_taxc);
			NewRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', 1, 'F'); 	// With Holding Tax

		// Graba el invoice nuevo
		idRecord = nlapiSubmitRecord(NewRecord);

	// Devuel el id nuevo
	return idRecord;
}
/* ------------------------------------------------------------------------------------------------------
 * Funcion que devuelve los contactos del proyecto
 * Busqueda : LatamReady -  Law360 Contact
 * ID 		: customsearch_lmry_law360_contact_email
 * --------------------------------------------------------------------------------------------------- */
function las360_contact(internalid){
	var aContact = new Array();
	// Ejecuta la busqueda  
	var cResult = nlapiLoadSearch('contact', 'customsearch_lmry_law360_contact_email');	
		cResult.addFilter(new nlobjSearchFilter('company', null, 'anyof', internalid));
	var dResult = cResult.runSearch();
	// Trae rango de 1000 Registros
	var lResult = dResult.getResults(0, 1000);
	if (lResult != null && lResult != '')
	{
		var intLength = lResult.length;

		// Procesa la busqueda consultada
		var pos = 0;
		while ( pos<intLength )	
		{
			// Columnas del reporte
			var datColumns = lResult[pos].getAllColumns();	

			// Coloca los correo en un arreglo
			aContact[pos] = lResult[pos].getValue(datColumns[2]);
			// Siguiente registro
			pos++;
		}
	}

	// Libera variables
	var cResult = null;	
	var dResult = null;
	var lResult = null;	

	// devuelve el correo
	return aContact;
} 

/* ------------------------------------------------------------------------------------------------------
 * Nota: Envio de mail al usuario.
 * 		 namesubs = ID Subsidiaria
 * 		 nameproj = ID Projecto
 * 		 nameperi = Nombre Periodo
 * --------------------------------------------------------------------------------------------------- */
function law360_sendcustomer(popcion, projectid, nameperi, strlang)
{
	try
	{
		// Lista de correos
		var bcc = new Array();
		var cco = new Array();

		// Verifica si es One World
		var featuresubs = objContext.getFeature('SUBSIDIARIES');
		var employeeid  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_emp');
		if (employeeid=='' || employeeid==null) { return false; }

		// Lista de contacto
		var lContact = las360_contact(projectid);
		var iContact = lContact.length;

		// Datos del proyecto
		var record   = nlapiLookupField('job', projectid, ['companyname', 'customer', 'custentity_lmry_law360_email']);
		var userid   = record.customer;
		var nameasun = record.companyname;
		var empfir	 = record.companyname;
		var empema   = '';
		// Si no tiene contactos
		if (iContact==0)
		{
			empema   = record.custentity_lmry_law360_email;
			if (empema=='' || empema==null) {
				// Correo de preferencias generales
				empema = nlapiLookupField('employee', employeeid, 'email');
			}
		}else{
			var lin = 0;
			empema = lContact[lin];
			lin++
			while (lin<iContact)
			{
				bcc[lin-1] = lContact[lin];
				// Siguiente contacto
				lin++;
			}
		}


		// Verifica si es One World
		var msg_lg = '';
		var msg_en = '';
		var msg_sp = '';
		if ( featuresubs==true || featuresubs=='T') 
		{
			namesubs = nlapiLookupField('customer', userid, 'subsidiary'); 
			// Campos de la subsidiaria
			var aFields = new Array();
				aFields[0] = 'legalname';
				aFields[1] = 'custrecord_lmry_law360_email_head_logo';
				aFields[2] = 'custrecord_lmry_law360_email_time_msg_sp';
				aFields[3] = 'custrecord_lmry_law360_email_time_msg_en';
			var RecordSub = nlapiLookupField('subsidiary', namesubs, aFields); 
			// Nombre de la subsidiaria
			namesubs = RecordSub.legalname;
			// Logo de la empresa
			msg_lg = RecordSub.custrecord_lmry_law360_email_head_logo;
			// Mensaje en espanol
			msg_sp = RecordSub.custrecord_lmry_law360_email_time_msg_sp;
			// Mensaje en Ingles
			msg_en = RecordSub.custrecord_lmry_law360_email_time_msg_en;
			RecordSub = null;
		}else{
			var company = nlapiLoadConfiguration('companyinformation'); 
			// Nombre de la subsidiaria
			namesubs = company.getFieldValue('legalname');
			// Logo de la empresa
			msg_lg = company.getFieldValue('custrecord_lmry_law360_email_head_logo');
			// Mensaje en espanol
			msg_sp = company.getFieldValue('custrecord_lmry_law360_email_time_msg_sp');
			// Mensaje en Ingles
			msg_en = company.getFieldValue('custrecord_lmry_law360_email_time_msg_en');
			company = null;
		}
		// Reemplaza variables en el texto en espanol
		msg_sp = msg_sp.replace('field_customer', empfir);
		msg_sp = msg_sp.replace('field_company', namesubs);
		msg_sp = msg_sp.replace('field_job'    , nameasun);
		msg_sp = msg_sp.replace('field_period' , nameperi);
		// Reemplaza variables en el texto en ingles
		msg_en = msg_en.replace('field_customer', empfir);
		msg_en = msg_en.replace('field_company', namesubs);
		msg_en = msg_en.replace('field_job'    , nameasun);
		msg_en = msg_en.replace('field_period' , nameperi);

		// Se optiene el URL
		var url = '';
		if ( msg_lg!='' && msg_lg!=null )
		{
			var getURL = objContext.getSetting('SCRIPT', 'custscript_lmry_netsuite_location');
			url = 'https://' + getURL + nlapiLoadFile(msg_lg).getURL();
		}

		// Generacion txt y envio de email
		var subject = namesubs 
			if (strlang.indexOf("sp")>0 || strlang.indexOf("SP")>0)
			{
				subject += ' - Estado de Cuenta de Gastos';
			}else{
				subject += ' - Expense Statement';
			}
		var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
				body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
					body += '<tr>';
					body += '<td width="100%" valign="top">';
						if (msg_lg!='' && msg_lg!=null)
						{
							body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
								body += '<tr>';
								body += '<td width="100%" colspan="2">';
								body += '<img src="' + url + '" width="25%" height="25%" border="0"/>'; 
								body += '</td>';
								body += '</tr>';
							body += '</table>';
						}
						// Cuerpo del correo
						body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
							body += '<tr>';
							body += '<td width="15%">&nbsp;</td>';
							body += '<td width="70%">';
							body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';
							// Mensaje personalizado en Espanol e Ingles
							if (strlang.indexOf("sp")>0 || strlang.indexOf("SP")>0)
							{
								body += '<p>Estimado Cliente:</p>';
								body += '<p>Este es un mensaje automático de "' + namesubs + '".</p>';
								if (popcion==1) {
									body += '<p>Gracias por su aprobación al Estado de Cuenta del "' + nameasun;
									body += '" del período de facturación de "' + nameperi + '".</p>';
									body += '<p>Se estará emitiendo la factura correspondiente y le estará llegando ';
									body += 'la confirmación en la brevedad posible.</p>';
								}else{
									body += '<p>El Estado de Cuenta del Asunto "' + nameasun;
									body += '" ha sido rechazado por el cliente.</p>';			
								}
							}else{
								body += '<p>Dear Customer:</p>';
								body += '<p>This is an automatic message from"' + namesubs + '".</p>';
								if (popcion==1) {
									body += '<p>Thank you for your approval of the Statement "' + nameasun;
									body += '" corresponding to the month of "' + nameperi + '".</p>';
									body += '<p>The corresponding invoice will be issued and it will be arriving ';
									body += 'confirmation as soon as possible.</p>';
								}else{
									body += '<p>The Statement of "' + nameasun;
									body += '" has been rejected by the customer.</p>';			
								}
							}
							body += '</font>';
							body += '</td>';
							body += '<td width="15%">&nbsp;</td>';
							body += '</tr>';
						body += '</table>';
						body += '<br>';
						// Mensaje que el correo no se responda
						body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
							body += '<tr>';
							body += '<td>&nbsp;</td>';
							body += '</tr>';
							body += '<tr>';
							body += '<td width="15%">&nbsp;</td>';
							body += '<td width="70%" align="center">';
							body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
							if (strlang.indexOf("sp")>0 || strlang.indexOf("SP")>0)
							{
								body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
							}else{
								body += '<i>This is an automatic message. Please do not reply to this email..</i>';
							}	
							body += '</font>';
							body += '</td>';
							body += '<td width="15%">&nbsp;</td>';
							body += '</tr>';
							body += '<tr>';
							body += '<td>&nbsp;</td>';
							body += '</tr>';
						body += '</table>';
					body += '</td>';
					body += '</tr>';
				body += '</table>';
			body += '</body>';
		
		nlapiLogExecution('ERROR', 'nlapiSendEmail: employeeid, empema, subject' , employeeid + ' , ' + empema + ' , ' + subject);

		// Api de Netsuite para enviar correo electronico
		nlapiSendEmail(employeeid, empema, subject, body, bcc, cco, null, null);

		// Envio de mail
		return true;
	}catch(err){
		// Log de Errores
		nlapiLogExecution('ERROR', 'law360_sendapprobe -> ', err);

		// Envia correo de error al usuario
		law360_sendemail(err + ' [law360_sendapprobe]', LMRY_script);

		// Envio de mail
		return false;
	}    
}