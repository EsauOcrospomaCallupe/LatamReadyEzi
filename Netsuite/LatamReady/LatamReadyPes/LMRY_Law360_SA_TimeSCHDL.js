/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Ene 2017     LatamReady Consultor
 * File : LMRY_Law360_SA_TimeSCHDL.js
 */
var objContext  =  nlapiGetContext();
var LMRY_script = "LatamReady - Law360 SA Time SCHDL";
var opcApprobe  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_app');
var opcReject   = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_rej');
var employeeid  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_emp');
var createinvo  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_create');
// Arreglo para la facturacion
var arrTimes = new Array();
var arrPosic = 0;
// Empieza el proceso del Schedule
function SAT_main_schedule()
{
	try {		
		// Log de Errores
		nlapiLogExecution('ERROR', 'SAT_main_schedule , createinvo -> ', 'Proceso Iniciado... - ' + createinvo);		
		
		/*********************************************************
		 * Registro Personalizado : LatamReady - Law360 TimeSheet
		 ********************************************************/ 
		
		// Arreglo de Filtros
		var filters = new Array();
			// Field : Latam - Law360 Account State
			// 		Record : LatamReady - Law360 State Account Time
			//		Field  : Latam - Law360 Schedule
			filters[0] = new nlobjSearchFilter('custrecord_lmry_law360_sacctime_sched', 'custrecord_lmry_law360_tsheet_accsta', 'is', 'T');	
		// Arreglo de Columnas
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_accsta');		// Latam - Law360 Account State
			columns[2] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_intern');		// Latam - Law360 Internal ID
			columns[3] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_projec');		// Latam - Law360 Project
			columns[4] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_period');		// Latam - Law360 Period
			columns[5] = new nlobjSearchColumn('custrecord_lmry_law360_sacctime_state', 'custrecord_lmry_law360_tsheet_accsta');
			columns[6] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_langua');		// Latam - Law360 Language
			columns[7] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_billabe');	// Latam - Law360 Billable
			columns[8] = new nlobjSearchColumn('customer', 'custrecord_lmry_law360_tsheet_projec');
			columns[9] = new nlobjSearchColumn('custrecord_lmry_law360_tsheet_curren');		// Latam - Law360 Currency
			columns[10]= columns[1].setSort(); 
		// Ejecuta la busqueda
		var objResult = nlapiSearchRecord('customrecord_lmry_law360_timesheet', null, filters, columns);	
		if (objResult!='' && objResult!=null)
		{
			if (objResult.length>0)
			{
				// Log de Errores
				nlapiLogExecution('ERROR', 'customrecord_lmry_law360_timesheet: length -> ', objResult.length);
				
				// Procesa la busqueda consultada
				var fil = 0;
				while ( fil<objResult.length )
				{
					// Estado de cuenta a Procesar
					var recordID = objResult[fil].getValue('custrecord_lmry_law360_tsheet_accsta');
					var reestado = objResult[fil].getValue('custrecord_lmry_law360_sacctime_state', 'custrecord_lmry_law360_tsheet_accsta');
					var languaj  = objResult[fil].getValue('custrecord_lmry_law360_tsheet_langua');
					var billing  = objResult[fil].getValue('custrecord_lmry_law360_tsheet_billabe');
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
					var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_time', 
									recordID, 
									'custrecord_lmry_law360_sacctime_state', 
									'Se esta procesando ...');

					// Arreglo de tiempos
					arrTimes = new Array();
					arrPosic = 0;

					// Internal ID del Proyecto
					arrTimes[arrPosic] = objResult[fil].getValue('custrecord_lmry_law360_tsheet_projec');
					// Internal ID del Cliente
					arrPosic++;			
					arrTimes[arrPosic] = objResult[fil].getValue('customer', 'custrecord_lmry_law360_tsheet_projec');				
					// Internal ID de la Moneda
					arrPosic++;			
					arrTimes[arrPosic] = objResult[fil].getValue('custrecord_lmry_law360_tsheet_curren');				

					// Se procesa las lineas de detalle
					while ( recordID== objResult[fil].getValue('custrecord_lmry_law360_tsheet_accsta') ) 
					{
						pasunto	   = objResult[fil].getValue('custrecord_lmry_law360_tsheet_projec'); 
						periodo    = objResult[fil].getValue('custrecord_lmry_law360_tsheet_period'); 

						var CustRecoID = objResult[fil].getValue('internalid');
						var InternalID = objResult[fil].getValue('custrecord_lmry_law360_tsheet_intern');
						if (InternalID!=null && InternalID!=''){
							var cresult1 = nlapiSubmitField('customrecord_lmry_law360_timesheet', CustRecoID, 'custrecord_lmry_law360_tsheet_cusapp', pstatus);
							var cresult2 = nlapiSubmitField('timebill', InternalID, 'custcol_lmry_law360_approve_status', pstatus);
							
							// Internal ID del TimeBill
							if (billing=='T' || billing==true)
							{
								arrPosic++;
								arrTimes[arrPosic] = InternalID;								
							}
							
							// Envio de mail
							sendmail = true;
						}

						// Siguiente Registro
						fil++;
						
						// Ultima linea
						if ( fil==objResult.length ) { break; }
					} // Se procesa las lineas de detalle

					// Envio de mail
					if (sendmail==true) 
					{							
						// Crea la factura si esta aprobado y activo el feature crear factura
						if ( pmensaje== 'Aprobado' && (createinvo=='T' || createinvo==true) )
						{
							var idinvoice = law360_invoice(arrTimes);
							
							// LatamReady - Law360  State Account Time
							if (idinvoice!=0)
							{
								var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_time', 
												recordID, 
												'custrecord_lmry_law360_sacctime_invoice',  idinvoice);
							}
						}
						// LatamReady - Law360  State Account Time
						var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_time', 
										recordID, 
										['custrecord_lmry_law360_sacctime_state', 'custrecord_lmry_law360_sacctime_sched'], 
										[pmensaje, 'F']);
						
						// Envio de Correo :  Project , periodo, Estado de cuenta
						law360_sendcustomer(buttomID, pasunto, periodo, languaj, recordID);

						// Unidades de memoria disponible
						var unimemory = objContext.getRemainingUsage();

						// Log de Errores
						nlapiLogExecution('ERROR', 'recordID , unimemory -> ', recordID + ' , ' + unimemory);
					} // Envio de mail
				} // Procesa la busqueda consultada
			}
		}
		
		// Log de Errores
		nlapiLogExecution('ERROR', 'SAT_main_schedule -> ', 'Proceso Terminado...');
 	}catch(err){		
		// Envia correo de error al usuario
		law360_sendemail(err + ' [SAT_main_schedule]', LMRY_script);		
	}
}
/* ------------------------------------------------------------------------------------------------------
 * Funcion para crear la factura de un estado de cuenta de tiempos
 * --------------------------------------------------------------------------------------------------- */
function law360_invoice(atimes)
{	
	try
	{
		var invoice_item  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_item');
		var invoice_taxc  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_taxcode');
		var invoice_loca  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_location');
		var idRecord = 0;
		var arrQY = atimes.length;
		// Log de Errores
		nlapiLogExecution('ERROR', 'law360_invoice - arrQY-> ', arrQY);
		if (arrQY<3) { return idRecord; }

		// Valida que este configurado para la generacion de factura
		if (invoice_item=='' || invoice_item==null || invoice_taxc=='' || invoice_taxc==null){
			// Log de Errores
			nlapiLogExecution('ERROR', 'law360_invoice - Falta configurar parametros-> ', invoice_item + ' , ' + invoice_taxc);
			
			// Termina la funcion
			return idRecord;
		}
		// Se optiene el valore del tipo de documento Sunat, en la ficha del cliente
		var tipodocu = nlapiLookupField('customer', atimes[1], 'custentity_tipo_doc_id_sunat');
	
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
			NewRecord.setFieldValue('entity', atimes[1]);		// Cliente
			NewRecord.setFieldValue('currency', atimes[2]);		// Moneda
			NewRecord.setFieldValue('location', invoice_loca) 	// Ubicacion
			// Pupulado de campoas para la FE
			NewRecord.setFieldValue('custbody_lmry_document_type', DocuTipo);		// Latam - Legal Document Type
			NewRecord.setFieldValue('custbody_lmry_serie_doc_cxc', DocuSeri);		// Latam - Serie CxC

			// Agrega el registro
			NewRecord.setLineItemValue('item', 'quantity'	, 1, 1);
			NewRecord.setLineItemValue('item', 'item'		, 1, invoice_item);
			NewRecord.setLineItemValue('item', 'price'		, 1, -1); // Custom
			NewRecord.setLineItemValue('item', 'rate'		, 1, nlapiFormatCurrency(1));
			NewRecord.setLineItemValue('item', 'taxcode'	, 1, invoice_taxc);
			NewRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', 1, 'F'); 	// With Holding Tax

		// Graba el invoice nuevo
		idRecord = nlapiSubmitRecord(NewRecord);

		var NewRecord = nlapiLoadRecord('invoice', idRecord);
	 		// Elimina las lineas de factura
			var recQY = NewRecord.getLineItemCount('item');
			for (var ind=1; ind<=recQY; ind++) 
			{
				NewRecord.selectLineItem('item', ind);
				NewRecord.removeLineItem('item', ind); 				
			}
	 		// Marca los tiempos a facturar
			var recQY = NewRecord.getLineItemCount('time');
			for (var ind=3; ind<arrQY; ind++) 
			{
				for (var pos=1; pos<=recQY; pos++) 
				{
					if (NewRecord.getLineItemValue('time', 'doc', pos)==atimes[ind])
					{
						NewRecord.setLineItemValue('time', 'apply', pos, 'T');
					}
				}
			}
		// Graba el invoice nuevo
		if ( recQY==0 )
		{
			// Log de Errores
			nlapiLogExecution('ERROR', 'law360_invoice - No tiene tiempos para facturar atimes-> ', atimes);
			
			// Elimina la factura temporal
			nlapiDeleteRecord('invoice', idRecord);
			
			// Libera el internal ID
			idRecord = 0;
		}else{
			idRecord = nlapiSubmitRecord(NewRecord);
		}
 	}catch(err){		
		// Envia correo de error al usuario
		law360_sendemail(err + ' [ law360_invoice ]', LMRY_script);
	}

	// Devuel el id nuevo
	return idRecord;
}
/* ------------------------------------------------------------------------------------------------------
 * Funcion que devuelve los contactos del proyecto
 * Busqueda : LatamReady -  Law360 Contact
 * ID 		: customsearch_lmry_law360_contact_email
 * --------------------------------------------------------------------------------------------------- */
function law360_contact(internalid)
{
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
 *		projectid = Internal ID del Projecto
 * 		nameperi = Nombre Periodo
 *		strlang   = Idioma del Projecto
 *		strBody   = Archivo Adjunto
 *		intRecord = Internal ID del Estado de Cuenta
 * --------------------------------------------------------------------------------------------------- */
function law360_sendcustomer(popcion, projectid, nameperi, strlang, intRecord)
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
		var lContact = law360_contact(projectid);
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
				aFields[0] = 'name';
				aFields[1] = 'custrecord_lmry_law360_email_head_logo';
				aFields[2] = 'custrecord_lmry_law360_email_time_msg_sp';
				aFields[3] = 'custrecord_lmry_law360_email_time_msg_en';
			var RecordSub = nlapiLookupField('subsidiary', namesubs, aFields); 
			// Nombre de la subsidiaria
			namesubs = RecordSub.name;
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
				subject += ' - Estado de Cuenta de Tiempo';
			}else{
				subject += ' - Time Statement';
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
		
		nlapiLogExecution('ERROR', 'Email: employeeid, empema, subject' , employeeid + ' , ' + empema + ' , ' + subject);

		// Api de Netsuite para enviar correo electronico
		nlapiSendEmail(employeeid, empema, subject, body, bcc, cco, null, null);

		// Envio de mail
		return true;
	}catch(err){
		// Envia correo de error al usuario
		law360_sendemail(err + ' [law360_sendapprobe]', LMRY_script);

		// Envio de mail
		return false;
	}    
}