/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Jul 2017     LatamReady 
 * File : LMRY_Boleteo_MasivoSCHDL.js
 */
// Nombre del Script
// Recuperamos valores
var objContext = nlapiGetContext(); 
var LMRY_script = "LatamReady - PE Boleteo Masivo SCHDL";
var opcApprobe  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_app');
var opcReject   = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_rej');
var employeeid  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_emp');
var createinvo  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_create');

// Arreglo para la facturacion

var arrPosic = 0;
// Empieza el proceso del Schedule
function BM_main_schedule()
{
	try {	
	 var itemsBus = new Array();	
		// Log de Errores
		nlapiLogExecution('ERROR', 'BM_main_schedule, createinvo -> ', 'Proceso Iniciado... - ' + createinvo);		

		// Ejecuta la busqueda
		var objResultSearch = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo','customsearch_lmry_pe_ei_boleteo_masivo');	
		var busquedaResult	= objResultSearch.runSearch();
		var objResult	= busquedaResult.getResults(0, 100);
		

		if (objResult!='' && objResult!=null)
		{
			if (objResult.length>0)
			{
				// Log de Errores
				nlapiLogExecution('ERROR', 'customrecord_lmry_pe_ei_boleteo_masivo: length -> ', objResult.length);

				
				// Procesa la busqueda consultada
				var fil = 0;
				while ( fil<objResult.length )
				{
					var vali=false;
					var columnsDetalle	=	objResult[fil].getAllColumns();
					
					// Estado de cuenta a Procesar
					var ID = objResult[fil].getValue(columnsDetalle[0]);
					var serie = objResult[fil].getValue(columnsDetalle[1]);
					var preimpreso  = objResult[fil].getValue(columnsDetalle[2]);
					var subsi 	 = objResult[fil].getValue(columnsDetalle[3]);
					var cliente  = objResult[fil].getValue(columnsDetalle[4]);
					var fecha 	 = objResult[fil].getValue(columnsDetalle[5]);
					var codigo 	 = objResult[fil].getValue(columnsDetalle[7]);
					var impuesto = objResult[fil].getValue(columnsDetalle[8]);
					var importe  = objResult[fil].getValue(columnsDetalle[9]);
					var item 	 = objResult[fil].getValue(columnsDetalle[10]);

					for(var i=0;i<itemsBus.length;i++){
						if(itemsBus[i][4]==serie){
							vali=true;
							break;
						}

					}
					if(vali){
						itemsBus[i][1]= itemsBus[i][1]+ parseFloat(importe);

					}else{
						itemsBus[itemsBus.length][0]=item;
						itemsBus[itemsBus.length][1]=importe;
						itemsBus[itemsBus.length][2]=impuesto;
						itemsBus[itemsBus.length][3]=
						itemsBus[itemsBus.length][4]=
						itemsBus[itemsBus.length][5]=
						itemsBus[itemsBus.length][6]=
					}
					
						
						// Siguiente Registro
						fil++;

						// Ultima linea
						if (fil==objResult.length){ break; }

						nlapiLogExecution('ERROR','createinvo',createinvo);
						// Crea la factura si esta aprobado y activo el feature crear factura
						if ( pmensaje== 'Aprobado' && (createinvo=='T' || createinvo==true) )

						{
							var idinvoice = BM_invoice(monto);
							nlapiLogExecution('ERROR','idinvoice',idinvoice);	
							
						}
						
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
function BM_invoice(montoTot, ArrItem)
{	
			
		var invoice_entity  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_expense_entity');
		var invoice_item  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_item');
		var invoice_taxc  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_taxcode');
		var idRecord = 0;

		// Valida que este configurado para la generacion de factura
		if (invoice_item=='' || invoice_item==null || invoice_taxc=='' || invoice_taxc==null){
			// Log de Errores
			nlapiLogExecution('ERROR', 'law360_invoice - Falta configurar parametros-> ', invoice_item + ' , ' + invoice_taxc);
			
			// Termina la funcion
			return idRecord;
		}
		
		var items= new Array();
		items=ArrItem;

		/**********************************************
		 * Crea el nuevo invoice - temporal para luego
		 *********************************************/ 
		var NewRecord = nlapiCreateRecord('invoice');
			NewRecord.setFieldValue('subsidiary', );		// Cliente
			NewRecord.setFieldValue('', );		//Fecha	
			NewRecord.setFieldValue('custbody_lmry_document_type', DocuTipo);		// Latam - Legal Document Type
			NewRecord.setFieldValue('custbody_lmry_serie_doc_cxc', DocuSeri);		// Latam - Serie CxC
			NewRecord.setFieldValue('', PrimerNumero);		// Latam - Numero Preimpreso
			NewRecord.setFieldValue('', UltimoNumero);		// Latam - Numero Final Preimpreso

			for(var i=0; i<items.length; i++){
				/*
				// Agrega el registro
				NewRecord.setLineItemValue('item', 'quantity'	, i+1, 1);
				NewRecord.setLineItemValue('item', 'item'		, i+1, invoice_item);
				NewRecord.setLineItemValue('item', 'rate'		, i+1, montoTotReg);//total de los importes Registro
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, invoice_taxc);
				//NewRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', 1, 'F'); 	// With Holding Tax
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, DocuTipo); 
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, DocuSeri);
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, invoice_NumeroIni);
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, invoice_NumeroFin);
				*/
				// Agrega el registro
				NewRecord.setLineItemValue('item', 'quantity'	, i+1, 1);
				NewRecord.setLineItemValue('item', 'item'		, i+1, items[i][0]);
				NewRecord.setLineItemValue('item', 'rate'		, i+1, items[i][1]);//total de los importes Registro
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, items[i][2]);
				//NewRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', 1, 'F'); 	// With Holding Tax
				NewRecord.setLineItemValue('item', ''	, i+1, items[i][3]); // TIPODOC
				NewRecord.setLineItemValue('item', ''	, i+1, items[i][4]); // Serie
				NewRecord.setLineItemValue('item', ''	, i+1, items[i][5]); // PRIMERO
				NewRecord.setLineItemValue('item', ''	, i+1, items[i][6]); // ULTIMO
			}

			

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