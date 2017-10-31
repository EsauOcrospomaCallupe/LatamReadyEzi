/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 ene 2017     LatamReady Consultor
 * File : LMRY_Law360_SOAofTimeSheetSCHDL.js
 */
var objContext = nlapiGetContext(); 
var LMRY_script = "LatamReady - Law360 Statements Account SCHDL";
// Parametro de configuracion
var daybill = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_billing_cycle');
var pstatus = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_pen');
// Control de Memoria
var intMaxReg = 1000;
var intMinReg = 0;
var bolStop = false;
var errStop = false;
var intTotalRows = 0;
var intLoops = 1; 
// Arreglo para temporales
var aLaw360TraID = new Array();	// InternalID
var aLaw360Rates = new Array();	// Lineas
//  Ver log de errores
var viewlog = true;
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function schedule_law360_sac_main()
{
	try {
		nlapiLogExecution('ERROR', 'Preferencias Empresa: daybill, pstatus -> ', daybill + ',' + pstatus);

		// Parametros
		var paramaidlog = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soa_id');
		var paramsubsid = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soa_sub');
		var paramperiod = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soa_per');
		var paramasunto = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soa_job');
		var paramposici = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soa_pos');

		nlapiLogExecution('ERROR', 'paramaidlog, paramsubsid, paramperiod, paramasunto -> '
								 , paramaidlog + ',' + paramsubsid + ',' + paramperiod + ',' + paramasunto + ',' + paramposici);
	
		// Quiebre de 1000 en 1000
		intMaxReg = paramposici; 
		intMinReg = intMaxReg; 
		intMaxReg = parseFloat(intMaxReg) + 1000;

		// Perido de Facturacion
		var dateini = '';
		var datefin = '';
		var columnFrom = nlapiLookupField('accountingperiod', paramperiod , ['enddate', 'periodname', 'startdate', 'enddate']);
		var cPName = columnFrom.periodname;
		// Solo para calcular los periodos de facturacion
		if (daybill==1 || daybill=='' || daybill==null){
			dateini = columnFrom.startdate;
			datefin = columnFrom.enddate;
		}else{
			var cToday = nlapiStringToDate(columnFrom.startdate);
			var cYear  = cToday.getFullYear().toFixed(0);
			var cMounth= cToday.getMonth().toFixed(0);
			// Rango de Fechas		
			var cdii = '00' + daybill.toString();
				cdii = cdii.substring(cdii.length-2,cdii.length);
			var cmei = '00' + cMounth.toString();
				cmei = cmei.substring(cmei.length-2,cmei.length);
			var cdif = '00' + ((parseInt(daybill)-1).toFixed(0)).toString();
				cdif = cdif.substring(cdif.length-2,cdif.length);
			var cmef = '00' + ((parseInt(cMounth)+1).toFixed(0)).toString();
				cmef = cmef.substring(cmef.length-2,cmef.length);
			if (cmei=='00') { dateini = cdii + '/12/' + (parseInt(cYear)-1).toString();
			}else{ dateini = cdii + '/' + cmei + '/' + cYear.toString(); }
			if (cmei!='12') { datefin = cdif + '/' + cmef + '/' + cYear.toString();
			}else{  datefin = cdif + '/' + cmef + '/' + (parseInt(cYear)+1).toString(); }
		}

		nlapiLogExecution('ERROR', 'Periodo de Facturacion' , dateini + ' , ' + datefin);
		
		// Actualiza el log de procesos
		nlapiSubmitField('customrecord_lmry_law360_sta_acc_tim_log', paramaidlog, 'custrecord_lmry_law360_soalog_sta', 'Procesando...')
		
		// Search = LatamReady - Law360 State Account Process
		var savedsearch = nlapiLoadSearch('timebill', 'customsearch_lmry_law360_statacc_process');	
			// Valida si es OneWorld
			var featuresubs = objContext.getFeature('SUBSIDIARIES');
			if (featuresubs==true || featuresubs=='T') {
				savedsearch.addFilter(new nlobjSearchFilter('subsidiary', null, 'anyof', paramsubsid));
			}
			// Periodo facturacion por mes
			savedsearch.addFilter(new nlobjSearchFilter('date', null, 'onorafter', dateini));
			savedsearch.addFilter(new nlobjSearchFilter('date', null, 'onorbefore', datefin));
			// Valida si esta activo Job
			var featurejobs = objContext.getFeature('jobs')
			if ( (featurejobs==true || featurejobs=='T') && paramasunto!='' && paramasunto!=null ) {
				savedsearch.addFilter(new nlobjSearchFilter('internalid', 'job', 'is', paramasunto));
			}
		var searchresult = savedsearch.runSearch();	
		while (!bolStop){
			//  Ver log de errores
			nlapiLogExecution('ERROR', 'Rango a consultar => ', intMinReg + ' - ' + intMaxReg);
			
			// Retorno de 1000 Registro
			var objResult = searchresult.getResults(intMinReg, intMaxReg);
			if (objResult != null)
			{
				// Cantidad de Registros
				var intLength = objResult.length;

				//  Ver log de errores
				nlapiLogExecution('ERROR', 'Cantidad Resultado', intLength);
			
				// Si se presenta un error, finaliza el programa
				errStop = false;

				// Empieza el barrido de la busqueda
				if (intLength==0) { bolStop = true; break; }
				var fil = 0;
				while (fil < intLength && !errStop)
				{
					// Obtiene el nombre de las columnas de la busqueda
					var columns = objResult[0].getAllColumns();
					
					// Key - Project + Perid
					var paraprojec = objResult[fil].getValue(columns[2]);
					var paraperiod = objResult[fil].getValue(columns[13]);
					if (paraperiod=='' || paraperiod==null )
					{
						paraperiod = cPName;
					}
					var keyCadAcc = paraprojec.toString();
					
					// Valida que la clave ya no este registrada
					var BuscaID = Law360SearchAcc(paraprojec, paraperiod);
					if ( BuscaID==-1 )  
					{ 
						errStop = true; 
						break;
					} else {
						// Variable para el ID de la cabecera
						var DatoInID = BuscaID;
						// Si el resultado es "0" crea el registro de cabecera 
						if ( BuscaID==0 ) 
						{
							// Obtiene el valor de las columnas
							var arrDatos = new Array();
								arrDatos[0] = paraperiod + ' : ' + 
											  objResult[fil].getText(columns[2]); 	// Name
								arrDatos[1] = objResult[fil].getValue(columns[2]); 	// Latam - Law360 Customer/Project
								arrDatos[2] = paraperiod;							// Latam - Law360 Period
								arrDatos[3] = ''; 									// Latam - Law360 Invoice
								arrDatos[4] = '';									// Latam - Law360 State
							// Crea el Registro de LatamReady - Law360 State Account Time
							DatoInID = Law360CreateAcc(arrDatos);
							if (DatoInID==0)
							{
								errStop = true; 
								break;
							}
						}
						
						// Crea el detale del Time Sheet
						while ( fil<intLength && keyCadAcc==objResult[fil].getValue(columns[2]) )
						{
							var arrValues = new Array();
								arrValues[0] = DatoInID;								// Latam - Law360 Account State
								arrValues[1] = objResult[fil].getValue(columns[1]);		// Latam - Law360 Internal ID
								arrValues[2] = objResult[fil].getValue(columns[2]);		// Latam - Law360 Project
								arrValues[3] = objResult[fil].getValue(columns[3]);		// Latam - Law360 Resource
								arrValues[4] = objResult[fil].getValue(columns[4]);		// Latam - Law360 Date
								arrValues[5] = objResult[fil].getValue(columns[5]);		// Latam - Law360 Duration
								arrValues[6] = objResult[fil].getValue(columns[6]);		// Latam - Law360 Duration (Decimal)
								arrValues[7] = objResult[fil].getValue(columns[7]);		// Latam - Law360 Currency
								arrValues[8] = objResult[fil].getValue(columns[8]);		// Latam - Law360 Time Rate
								arrValues[9] = objResult[fil].getValue(columns[9]);		// Latam - Law360 Description
								arrValues[10] = objResult[fil].getValue(columns[10]);	// Latam - Law360 Level
								arrValues[11] = objResult[fil].getValue(columns[11]);	// Latam - Law360 Type					
								arrValues[12] = objResult[fil].getValue(columns[12]);	// Latam - Law360 Billable
								// Validamos si el campo period esta lleno
								if (objResult[fil].getValue(columns[13])=='' || objResult[fil].getValue(columns[13])==null)
								{
									arrValues[13] = paraperiod;								// Latam - Law360 Period
								}else{
									arrValues[13] = objResult[fil].getValue(columns[13]);	// Latam - Law360 Period
								}
								// Validamos el estado de Aprobacion por el cliente
								if (objResult[fil].getValue(columns[14])=='' || objResult[fil].getValue(columns[14])==null)
								{
									arrValues[14] = pstatus;								// Latam - Law360 Cust. Approval Status
								}else{
									arrValues[14] = objResult[fil].getValue(columns[14]);	// Latam - Law360 Cust. Approval Status
								}
								arrValues[15] = objResult[fil].getValue(columns[15]);	// Latam - Law360 Billing Status
								arrValues[16] = objResult[fil].getValue(columns[16]);	// Latam - Law360 Observation Type
								arrValues[17] = objResult[fil].getValue(columns[17]);	// Latam - Law360 Remarks Customer
								arrValues[18] = objResult[fil].getValue(columns[18]);	// Latam - Law360 Language
								arrValues[19] = objResult[fil].getValue(columns[19]);	// Latam - Law360 Remarks Resource
								arrValues[20] = objResult[fil].getValue(columns[20]);	// Latam - Law360 Is Minimum Amount 
								arrValues[21] = objResult[fil].getValue(columns[21]);	// Latam - Law360 Minimum Amoun
								arrValues[22] = objResult[fil].getValue(columns[22]);	// Latam Col - Law360 TimeSheet (Referencia)
								arrValues[23] = objResult[fil].getValue(columns[23]);	// Latam - Law360 TimeSheet
							// Crea el Registro de LatamReady - LatamReady - Law360 TimeSheet
							var TimeSheetID = Law360CreateTS(arrValues);
							if (TimeSheetID==0) 
							{ 
								errStop = true; 
								break;
							}
							
							// Siguiente Registro
							fil++;
							
							// Cantidad de filas procesadas
							paramposici++;
							
							// Unidades de memoria disponible
							var unimemory = objContext.getRemainingUsage();
							if (unimemory<900) { break; }
						} // Fin 2do While
					} // Fin if de busqueda
					
					// Unidades de memoria disponible
					var unimemory = objContext.getRemainingUsage();
					if (unimemory<900) { break; }
				} // Fin 1er While
				
				nlapiLogExecution('ERROR', 'Procesando ... getRemainingUsage', unimemory);
				
				// Si no hay unidades de memoria corta el proceso
				if ( (!bolStop && unimemory<900) || errStop) { break; }

				// Quiebre de 1000 en 1000
				intMinReg = intMaxReg; 
				intMaxReg += 1000;
				if ( intLength>0 && intLength<1000 ) { bolStop = true; }
			} else {
				bolStop = true;
			}
		}
	
		// Actualiza el log de procesos
		var FechaFin = new Date();
			FechaFin = nlapiDateToString(FechaFin);
		if (!errStop){
			nlapiSubmitField('customrecord_lmry_law360_sta_acc_tim_log', paramaidlog, 
							['custrecord_lmry_law360_soalog_sta', 'custrecord_lmry_law360_soalog_end'], 
							['Finalizado', FechaFin]);
		}else{
			nlapiSubmitField('customrecord_lmry_law360_sta_acc_tim_log', paramaidlog, 
							['custrecord_lmry_law360_soalog_sta', 'custrecord_lmry_law360_soalog_end'], 
							['Cancelado', FechaFin]);
		}

		// Quiebre de proceso
		if (!bolStop){
			// Usuario que lanzo el proceso
			var paramausers = nlapiLookupField('customrecord_lmry_law360_sta_acc_tim_log', paramaidlog, 'custrecord_lmry_law360_soalog_emp');
			// Creacion de la linea en el log de errores
			var record = nlapiCreateRecord('customrecord_lmry_law360_sta_acc_tim_log');
				record.setFieldValue('custrecord_lmry_law360_soalog_sub', paramsubsid);
				record.setFieldValue('custrecord_lmry_law360_soalog_per', paramperiod);
				record.setFieldValue('custrecord_lmry_law360_soalog_pro', paramasunto);
				record.setFieldValue('custrecord_lmry_law360_soalog_emp', paramausers);
				record.setFieldValue('custrecord_lmry_law360_soalog_sta', 'Continua Proceso ...');
				record.setFieldValue('custrecord_lmry_law360_soalog_end', '');
			var rec_id = nlapiSubmitRecord(record, true);

			// Parametros del Schedule
			var params = new Array();
				params['custscript_lmry_law360_param_soa_id']  = rec_id;
				// Valida si es OneWorld
				var featuresubs = objContext.getFeature('SUBSIDIARIES');
				if (featuresubs == true || featuresubs == 'T') {
					params['custscript_lmry_law360_param_soa_sub'] = paramsubsid;
				}
				params['custscript_lmry_law360_param_soa_per']  = paramperiod;
				params['custscript_lmry_law360_param_soa_job']  = paramasunto;
				params['custscript_lmry_law360_param_soa_pos']  = paramposici;
			// Ejecuta el Shedule
			var status = nlapiScheduleScript('customscript_lmry_law360_stat_acts_schdl', 'customdeploy_lmry_law360_stat_acts_schdl', params);
		}else{
			if (!errStop){
				law360_sendrptuser('',2,'El proceso de LatamReady - Ejecucion de Estados de Cuenta, acaba de terminar.');
			}
		}
	} catch(err) {
		// Actualiza el log de procesos
		nlapiSubmitField('customrecord_lmry_law360_sta_acc_tim_log', paramaidlog, 'custrecord_lmry_law360_soalog_sta', 'Cancelado')

		// Envia correo de error al usuario
		law360_sendemail(err, LMRY_script);
	}

	return true;
}

/*****************************************************
 * Funcion para buscar si existe informacion en el
 * Registro personalizado
 * "LatamReady - Law360  State Account Time" 
 *************************************************** */
function Law360SearchAcc(paraproject, paraperiod)
{
	var recExist = 0;
	try{	
		// Arreglo de Filtros
		var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_lmry_law360_sacctime_project', null, 'is', paraproject);	
			filters[1] = new nlobjSearchFilter('custrecord_lmry_law360_sacctime_period', null, 'is', paraperiod);	
		// Arreglo de Columnas
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('name');
		// Ejecuta la busqueda
		var objResult = nlapiSearchRecord('customrecord_lmry_law360_state_acc_time', null, filters, columns);	
		if (objResult!='' && objResult!=null){
			if (objResult.length>0){
				recExist = objResult[0].getValue('internalid');
			}
		}		
 	} catch(err) {
 		recExist = -1;
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360SearchAcc]', LMRY_script);
	}
	return recExist;
}
/*****************************************************
 * Funcion para crear nuevo registro personalizado
 * "LatamReady - Law360  State Account Time"
 * arrValues	= Arreglo que contiene los nuevos 
 *				  valores para el registro a crear.
 *************************************************** */
function Law360CreateAcc(arrValues)
{
	// Grabacion exitosa
	var idRecord = 0;
	try{
		// Arreglo de campos
		var arrFields = new Array();
			arrFields[0] = 'name';
			arrFields[1] = 'custrecord_lmry_law360_sacctime_project'; 
			arrFields[2] = 'custrecord_lmry_law360_sacctime_period'; 
			arrFields[3] = 'custrecord_lmry_law360_sacctime_invoice'; 
			arrFields[4] = 'custrecord_lmry_law360_sacctime_state'; 

		// Crea pediodo
		var newRecord = nlapiCreateRecord('customrecord_lmry_law360_state_acc_time');
			newRecord.setFieldValue(arrFields[0], arrValues[0]);
			newRecord.setFieldValue(arrFields[1], arrValues[1]);
			newRecord.setFieldValue(arrFields[2], arrValues[2]);
			newRecord.setFieldValue(arrFields[3], arrValues[3]);
			newRecord.setFieldValue(arrFields[4], arrValues[4]);
		idRecord  = nlapiSubmitRecord(newRecord);
 	} catch(err) {
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360CreateAcc]', LMRY_script);
	}
	// Devuelve el resultado de la grabacion
	return idRecord;
}

/*****************************************************
 * Funcion para crear nuevo registro personalizado
 * "LatamReady - Law360 TimeSheet"
 * arrValues	= Arreglo que contiene los nuevos 
 *				  valores para el registro a crear.
 *************************************************** */
function Law360CreateTS(arrValues)
{
	// Grabacion exitosa
	var idRecord = 0;
	try{
		// Arreglo de campos
		var arrFields = new Array();
			arrFields[0] = 'custrecord_lmry_law360_tsheet_accsta'; 
			arrFields[1] = 'custrecord_lmry_law360_tsheet_intern'; 
			arrFields[2] = 'custrecord_lmry_law360_tsheet_projec'; 
			arrFields[3] = 'custrecord_lmry_law360_tsheet_resour'; 
			arrFields[4] = 'custrecord_lmry_law360_tsheet_date'; 
			arrFields[5] = 'custrecord_lmry_law360_tsheet_durati'; 
			arrFields[6] = 'custrecord_lmry_law360_tsheet_decima'; 
			arrFields[7] = 'custrecord_lmry_law360_tsheet_curren'; 
			arrFields[8] = 'custrecord_lmry_law360_tsheet_timrat'; 
			arrFields[9] = 'custrecord_lmry_law360_tsheet_descri'; 
			arrFields[10] = 'custrecord_lmry_law360_tsheet_level'; 
			arrFields[11] = 'custrecord_lmry_law360_tsheet_type'; 
			arrFields[12] = 'custrecord_lmry_law360_tsheet_billabe'; 
			arrFields[13] = 'custrecord_lmry_law360_tsheet_period'; 
			arrFields[14] = 'custrecord_lmry_law360_tsheet_cusapp'; 
			arrFields[15] = 'custrecord_lmry_law360_tsheet_bilsta'; 
			arrFields[16] = 'custrecord_lmry_law360_tsheet_obstyp'; 
			arrFields[17] = 'custrecord_lmry_law360_tsheet_remcus'; 
			arrFields[18] = 'custrecord_lmry_law360_tsheet_langua'; 
			arrFields[19] = 'custrecord_lmry_law360_tsheet_remres'; 
			arrFields[20] = 'custrecord_lmry_law360_tsheet_is_minamt'; 
			arrFields[21] = 'custrecord_lmry_law360_tsheet_minamo'; 
			arrFields[22] = 'custrecord_lmry_law360_tsheet_tsheet'; 
			arrFields[23] = 'custrecord_lmry_law360_tsheet_time'; 
		// Crea pediodo
		var newRecord = ''
			if (arrValues[22]=='' || arrValues[22]==null){
				newRecord = nlapiCreateRecord('customrecord_lmry_law360_timesheet');
			}else{
				newRecord = nlapiLoadRecord('customrecord_lmry_law360_timesheet', arrValues[22]);
			}
			newRecord.setFieldValue(arrFields[0], arrValues[0]);
			newRecord.setFieldValue(arrFields[1], arrValues[1]);
			newRecord.setFieldValue(arrFields[2], arrValues[2]);
			newRecord.setFieldValue(arrFields[3], arrValues[3]);
			newRecord.setFieldValue(arrFields[4], arrValues[4]);
			newRecord.setFieldValue(arrFields[5], arrValues[5]);
			newRecord.setFieldValue(arrFields[6], arrValues[6]);
			newRecord.setFieldValue(arrFields[7], arrValues[7]);
			newRecord.setFieldValue(arrFields[8], arrValues[8]);
			newRecord.setFieldValue(arrFields[9], arrValues[9]);
			newRecord.setFieldValue(arrFields[10], arrValues[10]);
			newRecord.setFieldValue(arrFields[11], arrValues[11]);
			newRecord.setFieldValue(arrFields[12], arrValues[12]);
			newRecord.setFieldValue(arrFields[13], arrValues[13]);
			newRecord.setFieldValue(arrFields[14], arrValues[14]);
			newRecord.setFieldValue(arrFields[15], arrValues[15]);
			newRecord.setFieldValue(arrFields[16], arrValues[16]);
			newRecord.setFieldValue(arrFields[17], arrValues[17]);
			newRecord.setFieldValue(arrFields[18], arrValues[18]);
			newRecord.setFieldValue(arrFields[19], arrValues[19]);
			newRecord.setFieldValue(arrFields[20], arrValues[20]);
			newRecord.setFieldValue(arrFields[21], arrValues[21]);
			if (arrValues[23]!=null)
			{
				newRecord.setFieldValue(arrFields[22], arrValues[23]);
			}else{
				newRecord.setFieldValue(arrFields[22], '');
			}
			newRecord.setFieldValue(arrFields[23], arrValues[1]);
		idRecord  = nlapiSubmitRecord(newRecord);

		/* ******************************************************************
		 * Actualiza en el TimeBill la columna LATAM COL - LAW360 TIMESHEET  
		 * con el InternaLID del registro Procesado, solo si este no
		 * fue procesado antes
		 * *****************************************************************/
		if (arrValues[22]=='' || arrValues[22]==null)
		{
			var InterID = arrValues[1];
			var cresult = nlapiSubmitField('timebill', InterID, 'custcol_lmry_law360_timesheet', idRecord);
		}else{
			idRecord = arrValues[20];
		}
	// Captura el error
 	} catch(err) {
 		idRecord = 0;
		// Envia correo de error al usuario
		law360_sendemail(err + ' - ID ' + arrValues[1] + ' [Law360CreateTS]', LMRY_script);
	}

	// Devuelve el resultado de la grabacion
	return idRecord;
}