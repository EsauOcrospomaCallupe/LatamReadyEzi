/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Ene 2017     LatamReady Consultor
 * File : LMRY_Law360_SA_TimeSTLT.js
 */
var objContext  =  nlapiGetContext();
var LMRY_script = "LatamReady - Law360 SA Time STLT";
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
 function SAT_main_suitelet( request, response )
 {
	try { 
		if ( request.getMethod() == 'GET' ) 
		{
			// Log de Errores
			nlapiLogExecution('ERROR', 'Valida Parametro -> ', request.getParameter('TranID'));
			
			// Parametros			
			var buttomID = request.getParameter('ButtID');
			var recordID = request.getParameter('TranID');
			if (recordID=='' || recordID==null)
			{
				var form  = nlapiCreateForm( LMRY_script );
				// Mensaje para el cliente
				var myInlineHtml = form.addField('custpage_lmry_v_message', 'inlinehtml').setLayoutType('outsidebelow','startcol');
				var strhtml = "<html>";
					strhtml += "<table border='0' class='table_fields' cellspacing='0' cellpadding='0'>" +
							"<tr>" +
							"</tr>" +
							"<tr>" +
							"<td class='text'>" +
							"<div style=\"color: gray; font-size: 12pt; margin-top: 10px; padding: 5px; border-top: 1pt solid silver\">Importante: El acceso no esta permitido.</div>" +
							"</td>" +
							"</tr>" +
							"</table>" +
							"</html>";
				myInlineHtml.setDefaultValue(strhtml);					
				
				// Dibuja el Formulario
				response.writePage(form);	

				// Sale del SuiteLet
				return true;
			}
			// Log de Errores
			nlapiLogExecution('ERROR', 'SAT_main_suitelet -> ', 'Inicio');
			
			// Campos del registro
			var fields = new Array();
				fields[0] = 'custrecord_lmry_law360_sacctime_project';
				fields[1] = 'custrecord_lmry_law360_sacctime_period';
			// Resultado del Proceso
			var record = nlapiLookupField('customrecord_lmry_law360_state_acc_time'
										, recordID, fields);
			var pasunto  = record.custrecord_lmry_law360_sacctime_project
			var tranperi = record.custrecord_lmry_law360_sacctime_period;
			
			// Envio de Coreeo : Usuario , Periodo
			var result = law360_sendapprobe(buttomID, pasunto, tranperi);
			if (result==true){
				var msgestado = '';
				if (buttomID==1){
					msgestado = 'En proceso de Aprobacion'; 
				}else{
					msgestado = 'En proceso de Rechazo';
				}

				// LatamReady - Law360  State Account Time
				var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_time', 
								recordID, 
								['custrecord_lmry_law360_sacctime_state', 'custrecord_lmry_law360_sacctime_sched'], 
								[msgestado, 'T']);				
			}

			// Log de Errores
			nlapiLogExecution('ERROR', 'SAT_main_suitelet -> ', 'Termino');
		}
 	}catch(err){		
		// Envia correo de error al usuario
		law360_sendemail(err + ' [SAT_main_suitelet]', LMRY_script);		
	}
}

/* ------------------------------------------------------------------------------------------------------
 * Nota: Envio de mail al usuario.
 * 		 popcion  = Boton presionado
 * 		 nameproj = ID Projecto
 * 		 nameperi = Nombre Periodo
 * --------------------------------------------------------------------------------------------------- */
function law360_sendapprobe(popcion, projectid, nameperi)
{
	try
	{
		// Verifica si es One World
		var featuresubs = objContext.getFeature('SUBSIDIARIES');
		var employeeid  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_emp');
		if (employeeid=='' || employeeid==null) { return false; }

		nlapiLogExecution('ERROR', 'law360_sendapprobe' , projectid + ' , ' + nameperi);

		var record = nlapiLookupField('job', projectid, ['companyname', 'customer']);
		var userid   = record.customer;
		var nameasun = record.companyname;

		var userfn = [ 'email', 'companyname' ];
		var employ = nlapiLookupField('customer', userid, userfn);
		if ( employ.email=='' || employ.email==null)
		{
			nlapiLogExecution('ERROR', 'law360_sendapprobe' , 'Cliente no tiene correo');
			return false;
		}
		var empema = employ.email;
		var empfir = employ.companyname;
		
		// Verifica si es One World
		if ( featuresubs==true || featuresubs=='T') 
		{
			namesubs = nlapiLookupField('customer', userid, 'subsidiary'); 
			namesubs = nlapiLookupField('subsidiary', namesubs, 'name'); 
		}else{
			var company = nlapiLoadConfiguration('companyinformation'); 
			namesubs = company.getFieldValue('name');
			company = null;
		}
		
		nlapiLogExecution('ERROR', 'law360_sendapprobe: empema, empfir, namesubs' , empema + ' , ' + empfir + ' , ' + namesubs);

		// Generacion txt y envio de email
		var subject = namesubs 
		if (popcion==1) {
			subject += ' - Estado de Cuenta Aprobado.';
		}else{
			subject += ' - Estado de Cuenta Rechazado.';
		}
		var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
			body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
			body += '<tr>';
			body += '<td width="100%" valign="top">';
			body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
			body += '<tr>';
			body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
			body += '<td bgcolor="#d50303" width="85%">';
			body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
			body += 'Estimado Cliente, ' + empfir + ':<br>';
			body += '</font>';
			body += '</td>';
			body += '</tr>';
			body += '</table>';
			body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
			body += '<tr>';
			body += '<td width="15%">&nbsp;</td>';
			body += '<td width="70%">';
			body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';
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
			body += '<p>Muchas gracias por confiar en nosotros.</p>';
			body += '<p>Atentamente</p>';
			body += '</font>';
			body += '</td>';
			body += '<td width="15%">&nbsp;</td>';
			body += '</tr>';
			body += '</table>';
			body += '<br>';
			body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
			body += '<tr>';
			body += '<td>&nbsp;</td>';
			body += '</tr>';
			body += '<tr>';
			body += '<td width="15%">&nbsp;</td>';
			body += '<td width="70%" align="center">';
			body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
			body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
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
		var bcc = new Array();
		var cco = new Array();
		
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