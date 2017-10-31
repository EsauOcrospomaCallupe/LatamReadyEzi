/**	
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       9 Feb 2017     LatamReady Consultor
 * File : LMRY_Law360_SA_TimeCLNT.js
 */
// Nombre del Script
var LMRY_script = "LatamReady - Law360 SA Time CLNT";

function law360_onclick_ts_approved()
{
	try{
		// Verifica si esta pendiente de procesar
		var procesado = nlapiLookupField('customrecord_lmry_law360_state_acc_time'
										, nlapiGetRecordId()
										, 'custrecord_lmry_law360_sacctime_state');
		if (procesado=='Aprobacion Pendiente')
		{
			// Mensaje al usuario
			alert('El estado de cuenta ya esta en Aprobacion Pendiente. Presione el boton actualizar.');
			
			// Sale de la funcion 
			return true;
		}

		// Confirmacion por parte del usuario
		var result = confirm('Esta seguro que desea aprobar el Estado de Cuenta Actual?');
		if (result)
		{				
			// LatamReady - Law360  State Account Time
			var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_time', 
							nlapiGetRecordId(), 
							['custrecord_lmry_law360_sacctime_state', 'custrecord_lmry_law360_sacctime_sched'], 
							['Aprobacion Pendiente', 'T']);
			
			// Mensaje en pantalla
			law360_show_on_screen('Se ha lanzado el proceso, presione el boton [Actualizar] para ver el estado de cuenta.', false);
		}
	}catch(err){
		// Mensaje en pantalla
		law360_show_on_screen(err, false);
		
		// Envia correo de error al usuario
		law360_sendemail(err + ' [onclick_ts_approved]', LMRY_script);
	}

	return true;
}

/**
 * Funcion que se encarga de Rechazar la transacciones
 * y marcarla para ser procesada luego.
 */
function law360_onclick_ts_reject()
{
	try{
		// Verifica si esta pendiente de procesar
		var procesado = nlapiLookupField('customrecord_lmry_law360_state_acc_time'
										, nlapiGetRecordId()
										, 'custrecord_lmry_law360_sacctime_state');
		if (procesado=='Rechazado Pendiente')
		{
			// Mensaje al usuario
			alert('El estado de cuenta ya esta en Rechazado Pendiente. Presione el boton actualizar.');
			
			// Sale de la funcion 
			return true;
		}

		// Confirmacion por parte del usuario
		var result = confirm('Esta seguro que desea rechazar el Estado de Cuenta Actual?');
		if (result)
		{
			// LatamReady - Law360  State Account Time
			var cresult = nlapiSubmitField('customrecord_lmry_law360_state_acc_time', 
							nlapiGetRecordId(), 
							['custrecord_lmry_law360_sacctime_state', 'custrecord_lmry_law360_sacctime_sched'], 
							['Rechazado Pendiente', 'T']);
			
			// Mensaje en pantalla
			law360_show_on_screen('Se a lanzo el proceso, presione el boton [Actualizar] para ver el estado de cuenta.', false);
		}
	}catch(err){
		// Mensaje en pantalla
		law360_show_on_screen(err, false);
		
		// Envia correo de error al usuario
		law360_sendemail(err + ' [onclick_ts_reject]', LMRY_script);
	}

	return true;
}

/**
 * Funcion que se encarga de refrescar la pagina
 */
function law360_onclick_ts_refresh(){
	location.reload();
}
/* ------------------------------------------------------------------------------------------------------
 * Imprime alertas en la pagina y las deja ahi. Para el ultimo paso de la secuencia
 * @param message
 * @param alert (true = muestra un icono de alerta, false = muestra en icono de confirmacion)
 * --------------------------------------------------------------------------------------------------- */
function law360_show_on_screen(message, alert) 
{
	try
	{
		// Mensaje dentro de la pantalla de Netsuite
	    if (alert) {
	        jQuery('<div id="lmry_div_alert_1">' +
	            '<div class="uir-alert-box warning conflictwarningdivdomid" width="undefined" style="">' +
	            '<div class="icon warning"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=576&c=TSTDRV1038915&h=afcac1eba8e3bbfc630e" alt="">' +
	            '</div><div class="content">' +
	            '<div class="title">LatamReady - Alerta:</div>' +
	            '<div class="descr">' + message + '</div></div></div></div>').insertBefore('#div__title');

	    } else {
	        jQuery('<div id="lmry_div_alert_2">' +
	            '<div class="uir-alert-box confirmation session_confirmation_alert" width="100%" style="">' +
	            '<div class="icon confirmation"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=577&c=TSTDRV1038915&h=6fd5d72b69abf93869ab" alt="">' +
	            '</div><div class="content"><div class="title">LatamReady - Mensaje:</div>' +
	            '<div class="descr">' + message + '</div></div></div></div>').insertBefore('#div__title');
	    }
	} catch(err){
		law360_sendemail(' [ law360_show_on_screen ] ' +err, LMRY_script);
	}
}