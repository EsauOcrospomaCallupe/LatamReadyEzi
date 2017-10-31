/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Dic 2016     LatamReady Consultor
 * File : LMRY_Law360_SOAofExpenseSCHDL.js
 */
var objContext = nlapiGetContext(); 
var LMRY_script = "LatamReady - Law360 SOA of Expense SCHDL";
// Parametro de configuracion
var daybill = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_billing_cycle');
var pstatus = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_rating_status');
var dstart  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_stat_acts_dat');
// Control de Memoria
var intMaxReg = 1000;
var intMinReg = 0;
var bolStop = false;
var intTotalRows = 0;
var intLoops = 1; 
// Arreglo para temporales
var aLaw360TraID = new Array();	// InternalID
var aLaw360Rates = new Array();	// Lineas
// Arreglos para el tipo de cambo y fecha
var dExRate = new Array();
var iExRate = new Array();
//  Ver log de errores
var viewlog = true;
// Variable de transaccion
var TranID = 0;
var TranRc = '';
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function schedule_law360_sace_main()
{
	try {
		// Parametros
		var paramaidlog = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soae_id');
		var paramsubsid = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soae_sub');
		var paramperiod = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soae_per');
		var paramasunto = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soae_job');
		var paramposici = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_param_soae_pos');

		// Quiebre de 1000 en 1000
		intMaxReg = paramposici; 
		intMinReg = intMaxReg; 
		intMaxReg = parseFloat(intMaxReg) + 1000;

		// la Fecha en un arreglo
		var datStart = '';
		var auxStart = '';
		if (dstart!='' && dstart!=null) {
			datStart = dstart.split('/');
		}

		nlapiLogExecution('ERROR', 'paramaidlog, paramsubsid, paramperiod, paramasunto, paramposici -> '
								 , paramaidlog + ',' + paramsubsid + ',' + paramperiod + ',' + paramasunto + ',' + paramposici);
	
		// Perido de Facturacion
		var dateini = '';
		var datefin = '';
		var columnFrom = nlapiLookupField('accountingperiod', paramperiod , ['enddate', 'periodname', 'startdate']);
		var cPName = columnFrom.periodname;
		// Solo para calcular los periodos de facturacion
		if (daybill==1 || daybill=='' || daybill==null)
		{
			dateini = columnFrom.startdate;
			datefin = columnFrom.enddate;
			/**************************************************************
			 * Se valida que el periodo sea mayo a la fecha de instalacion
			 * Se compara el mes y el ano de ambas fechas, que fueron
			 * convertidas en arreglo para una mejor comparacion
			 *************************************************************/ 
			if (datStart!='' && datStart!=null)
			{
				auxStart = dateini.split('/');
				if (datStart[1]==auxStart[1] && datStart[2]==auxStart[2])
				{
					dateini = dstart;
				}
			}
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
		nlapiSubmitField('customrecord_lmry_law360_sta_acc_exp_log', paramaidlog, 'custrecord_lmry_law360_soae_log_sta', 'Procesando...');
		
		// Arreglo para contro de tiempos		
		var arrFilas = 0;
		var errStop = false;
		
		// Calcula la fecha inicial
		var datebeg = dateini;
		if ( datefin!='' && datefin!=null )
		{
			var cToday = nlapiStringToDate(columnFrom.startdate);
			var cYear  = cToday.getFullYear().toFixed(0);
			var cMounth= cToday.getMonth().toFixed(0);
			if (cMounth==12){
				datebeg = '1/1/' + cYear.toString();
			}else{
				cYear = cYear - 1;
				aMounth = (12 - (12 - cMounth)) + 2;
				datebeg = '1/' + aMounth.toString() + '/' + cYear.toString();
			}
		}
		// Carga los tipos de cambio del periodo a procesar
		var cantERate = Law360SearchExRate(datebeg, datefin);

		// Search = LatamReady - Law360 Project Expenses
		var savedsearch = nlapiLoadSearch('transaction', 'customsearch_lmry_law360_project_expense');	
			// Valida si es OneWorld
			var featuresubs = objContext.getFeature('SUBSIDIARIES');
			if (featuresubs==true || featuresubs=='T') {
				savedsearch.addFilter(new nlobjSearchFilter('subsidiary', null, 'anyof', paramsubsid));
			}
			// Periodo facturacion por Periodo
			savedsearch.addFilter(new nlobjSearchFilter('postingperiod', null, 'onorafter', paramperiod));
			//savedsearch.addFilter(new nlobjSearchFilter('trandate', null, 'onorafter', dateini));
			//savedsearch.addFilter(new nlobjSearchFilter('trandate', null, 'onorbefore', datefin));
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
				// Empieza el barrido de la busqueda
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
					var paraprojec = objResult[fil].getValue(columns[4]);
					var paraperiod = cPName;
					var keyCadAcc = paraprojec.toString();
						keyCadAcc += '_';
						keyCadAcc += paraperiod.toString();
					
					// Valida que la clave ya no este registrada
					var BuscaID = Law360SearchAccExp(paraprojec, paraperiod);
					if (BuscaID==-1) 
					{ 
						errStop = true; 
						break;
					}else{
						// Variable para el ID de la cabecera
						var DatoInID = BuscaID;						
						if (BuscaID==0)
						{
							// Obtiene el valor de las columnas
							var arrDatos = new Array();
								arrDatos[0] = cPName + ' : ' + objResult[fil].getValue(columns[4]); // Name
								arrDatos[1] = objResult[fil].getValue(columns[4]); 	// Latam - Law360 Customer/Project
								arrDatos[2] = cPName;								// Latam - Law360 Period
								arrDatos[3] = ''; 									// Latam - Law360 Invoice
								arrDatos[4] = '';									// Latam - Law360 State
							// Crea el Registro de LatamReady - Law360 State Account Time
							var DatoInID = Law360CreateAccExp(arrDatos);
							if (DatoInID==0){ 
								errStop = true; 
								break;
							}
						}

						// Crea el detale del Time Sheet
						while ( fil < intLength &&
								(keyCadAcc==((objResult[fil].getValue(columns[4])).toString()) + '_' + cPName) )
						{
							// Tipo de cambio personalizado
							var custerate = 1;
							// Busca el tipo de cambio
							if (cantERate>0)
							{
								// Fecha de la transaccion
								var dat = objResult[fil].getValue(columns[5]);
								var pos = dExRate.indexOf(dat);
								if (pos!=-1) {
									custerate = iExRate[pos];
								}
							}

							// Carga los valores para el registro de gastos
							var arrValues = new Array();
								arrValues[0] = DatoInID;								// Latam - Law360 Account State
								arrValues[1] = objResult[fil].getText(columns[0]);		// Latam - Law360 Type Transaction
								arrValues[2] = objResult[fil].getValue(columns[3]);		// Latam - Law360 Transaction
								arrValues[3] = objResult[fil].getValue(columns[2]);		// Latam - Law360 Secuence Line
								arrValues[4] = objResult[fil].getValue(columns[3]);		// Latam - Law360 Internal ID
								arrValues[5] = objResult[fil].getValue(columns[4]);		// Latam - Law360 Project
								arrValues[6] = objResult[fil].getValue(columns[5]);		// Latam - Law360 Date
								arrValues[7] = objResult[fil].getValue(columns[6]);		// Latam - Law360 Amount
								arrValues[8] = objResult[fil].getValue(columns[7]);		// Latam - Law360 Description
								arrValues[9] = objResult[fil].getValue(columns[8]);		// Latam - Law360 Vendor
								arrValues[10] = objResult[fil].getValue(columns[9]);	// Latam - Law360 Billable
								arrValues[11] = objResult[fil].getValue(columns[10]);	// Latam - Law360 Item Markup
								arrValues[12] = objResult[fil].getValue(columns[11]);	// Latam - Law360 Rate					
								arrValues[13] = cPName;									// Latam - Law360 Period
								arrValues[14] = objResult[fil].getValue(columns[13]);	// Latam - Law360 Cust. Approval Status
								arrValues[15] = objResult[fil].getValue(columns[14]);	// Latam - Law360 Billing Status
								arrValues[16] = objResult[fil].getValue(columns[15]);	// Latam - Law360 Observation Type
								arrValues[17] = objResult[fil].getValue(columns[16]);	// Latam - Law360 Remarks Customer
								arrValues[18] = objResult[fil].getValue(columns[17]);	// Latam - Law360 Language
								arrValues[19] = objResult[fil].getValue(columns[18]);	// Latam - Law360 Remarks Resource
								arrValues[20] = objResult[fil].getValue(columns[19]);	// Latam - Law360 Transaction Exchange Rate
								arrValues[21] = custerate;								// Latam - Law360 Exchange Rate
								arrValues[22] = objResult[fil].getValue(columns[20]);	// Latam - Law360 Job Currency
								arrValues[23] = objResult[fil].getValue(columns[21]);	// Latam Col - Law360 Employee
								arrValues[24] = objResult[fil].getValue(columns[22]);	// Latam Col - Law360 Expense 
							// Crea el Registro de LatamReady - LatamReady - Law360 TimeSheet
							var TimeSheetID = Law360CreateExpense(arrValues);
							if (TimeSheetID==0) 
							{ 
								errStop = true; 
								break;
							}
/*							else{
								// *** Actualiza las lienas de la transaccion ***
								if ( TranID!=arrValues[2] )
								{
									// Graba cuando cambia de registro
									if ( TranID!=0 ){
										var result = nlapiSubmitRecord(TranRc);
									}
									// Internal ID
									TranID = arrValues[2];
									// Abre la transacion
									var TranTy = objResult[fil].getValue(columns[0]);
									if (TranTy=='VendBill') { TranTy = 'vendorbill'; }			// Bill
									if (TranTy=='VendCred') { TranTy = 'vendorcredit'; }		// Bill Credit
									if (TranTy=='ExpRept')  { TranTy = 'expensereport'; }		// Expense Report
									TranRc = nlapiLoadRecord(TranTy, TranID);
								}
								// Actualiza la linea
								TranRc.setLineItemValue('expense', 'custcol_lmry_law360_expense', arrValues[3], TimeSheetID);
								// Ultima Linea
								if ( fil==(intLength-1) )
								{
									var result = nlapiSubmitRecord(TranRc);
								}
							}
*/
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

				nlapiLogExecution('ERROR', 'Procesando ... getRemainingUsage , bolStop , errStop', unimemory + ' , ' + bolStop + ' , ' + errStop);

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
		if (errStop){
			nlapiSubmitField('customrecord_lmry_law360_sta_acc_exp_log', paramaidlog, 
							['custrecord_lmry_law360_soae_log_sta', 'custrecord_lmry_law360_soae_log_end'], 
							['Cancelado', FechaFin]);
		}else{
			nlapiSubmitField('customrecord_lmry_law360_sta_acc_exp_log', paramaidlog, 
							['custrecord_lmry_law360_soae_log_sta', 'custrecord_lmry_law360_soae_log_end'], 
							['Finalizado', FechaFin]);
		}

		// Quiebre de proceso
		if (!bolStop){
			// Usuario que lanzo el proceso
			var paramausers = nlapiLookupField('customrecord_lmry_law360_sta_acc_exp_log', paramaidlog, 'custrecord_lmry_law360_soae_log_emp');
			// Creacion de la linea en el log de errores
			var record = nlapiCreateRecord('customrecord_lmry_law360_sta_acc_exp_log');
				record.setFieldValue('custrecord_lmry_law360_soae_log_per', paramperiod);
				record.setFieldValue('custrecord_lmry_law360_soae_log_pro', paramasunto);
				record.setFieldValue('custrecord_lmry_law360_soae_log_emp', paramausers);
				record.setFieldValue('custrecord_lmry_law360_soae_log_sta', 'Pendiente');
				record.setFieldValue('custrecord_lmry_law360_soae_log_end', '');
			var rec_id = nlapiSubmitRecord(record, true);

			// Parametros del Schedule
			var params = new Array();
				params['custscript_lmry_law360_param_soae_id']  = rec_id;
				// Valida si es OneWorld
				var featuresubs = objContext.getFeature('SUBSIDIARIES');
				if (featuresubs == true || featuresubs == 'T') {
					params['custscript_lmry_law360_param_soae_sub'] = paramsubsid;
				}
				params['']  = paramperiod;
				params['custscript_lmry_law360_param_soae_job']  = paramasunto;
				params['custscript_lmry_law360_param_soae_pos']  = paramposici;
			// Ejecuta el Shedule
			var status = nlapiScheduleScript('customscript_lmry_law360_stat_acex_schdl', 'customdeploy_lmry_law360_stat_acex_schdl', params);	
		}else{
			if (!errStop){
				law360_sendrptuser('',2,'El proceso de LatamReady - Ejecucion de Estados de Cuenta Gastos, acaba de terminar.');
			}
		}
	} catch(err) {
		// Actualiza el log de procesos
		nlapiSubmitField('customrecord_lmry_law360_sta_acc_exp_log', paramaidlog, 'custrecord_lmry_law360_soae_log_sta', 'Cancelado')

		// Envia correo de error al usuario
		law360_sendemail(err, LMRY_script);
	}

	return true;
}

/*****************************************************
 * Funcion para cargar todos los tiempos de cambio
 * de un Periodo del Registro personalizado
 * "LatamReady - Law360 Exchange Rate" 
 * dExRate = Arreglo para las fechas
 * iExRate = Arreglo para los tipos de cambio
 *************************************************** */
function Law360SearchExRate(dateini, datefin)
{
	try{
		//  Ver log de errores
		nlapiLogExecution('ERROR', 'Exchange Rate: dateini , datefin', dateini + ' , ' + datefin);

		var canResult = 0;

		// Arreglo de Filtros
		var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_lmry_law360_exrate_date', null, 'onorafter', dateini);	
			filters[1] = new nlobjSearchFilter('custrecord_lmry_law360_exrate_date', null, 'onorbefore', datefin);	
		// Arreglo de Columnas
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('custrecord_lmry_law360_exrate_date');
			columns[1] = new nlobjSearchColumn('custrecord_lmry_law360_exrate_exrate');
		// Ejecuta la busqueda - LatamReady - Law360 Exchange Rate
		var objResult = nlapiSearchRecord('customrecord_lmry_law360_exchangerate', null, filters, columns);	
		if (objResult!='' && objResult!=null)
		{
			//  Ver log de errores
			nlapiLogExecution('ERROR', 'Exchange Rate: ', 'Cantidad - > ' + objResult.length);

			// Si hay data carga la busqueda a dos arreglos
			canResult = objResult.length;
			if (objResult.length>0)
			{
				var pos = 0;
				while (pos<objResult.length)
				{
					// Carga los valores del tipo de cambio
					dExRate[pos] =  objResult[pos].getValue('custrecord_lmry_law360_exrate_date') ;
					iExRate[pos] =  objResult[pos].getValue('custrecord_lmry_law360_exrate_exrate');
					// Siguiente Registro
					pos++;				
				}
			}	
		}		
 	} catch(err) {
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360SearchExRate]', LMRY_script);
	}
	return canResult;
}

/*****************************************************
 * Funcion para buscar si existe informacion en el
 * Registro personalizado
 * "LatamReady - Law360 State Account Expens" 
 *************************************************** */
function Law360SearchAccExp(paraproject, paraperiod)
{
	var recExist = 0;
	try{	
		// Arreglo de Filtros
		var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_lmry_law360_saccexpe_project', null, 'is', paraproject);	
			filters[1] = new nlobjSearchFilter('custrecord_lmry_law360_saccexpe_period', null, 'is', paraperiod);	
		// Arreglo de Columnas
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
			columns[1] = new nlobjSearchColumn('name');
		// Ejecuta la busqueda
		var objResult = nlapiSearchRecord('customrecord_lmry_law360_state_acc_expen', null, filters, columns);	
		if (objResult!='' && objResult!=null){
			if (objResult.length>0){
				recExist = objResult[0].getValue('internalid');
			}	
		}		
 	} catch(err) {
 		recExist = -1;
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360SearchAccExp]', LMRY_script);
	}
	return recExist;
}

/*****************************************************
 * Funcion para buscar si existe informacion en el
 * Registro personalizado de detalle de estado de Cta
 * "LatamReady - Law360 Expense" 
 *************************************************** */
function Law360SearchALinExp(intern, secuen)
{
	var recExist = 0;
	try{	
		// Arreglo de Filtros
		var filters = new Array();
			filters[0] = new nlobjSearchFilter('custrecord_lmry_law360_expens_intern', null, 'equalto', intern);	
			filters[1] = new nlobjSearchFilter('custrecord_lmry_law360_expens_secuen', null, 'equalto', secuen);	
		// Arreglo de Columnas
		var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
		// Ejecuta la busqueda
		var objResult = nlapiSearchRecord('customrecord_lmry_law360_expense', null, filters, columns);	
		if (objResult!='' && objResult!=null){
			if (objResult.length>0){
				recExist = objResult[0].getValue('internalid');
			}	
		}		
 	} catch(err) {
 		recExist = -1;
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360SearchALinExp]', LMRY_script);
	}
	return recExist;
}

/*****************************************************
 * Funcion para crear nuevo registro personalizado
 * "LLatamReady - Law360 State Account Expens"
 * arrValues	= Arreglo que contiene los nuevos 
 *				  valores para el registro a crear.
 *************************************************** */
function Law360CreateAccExp(arrValues)
{
	// Grabacion exitosa
	var idRecord = 0;
	try{
		// Arreglo de campos
		var arrFields = new Array();
			arrFields[0] = 'name';
			arrFields[1] = 'custrecord_lmry_law360_saccexpe_project'; 
			arrFields[2] = 'custrecord_lmry_law360_saccexpe_period'; 
			arrFields[3] = 'custrecord_lmry_law360_saccexpe_invoice'; 
			arrFields[4] = 'custrecord_lmry_law360_saccexpe_state'; 

		// Crea pediodo
		var newRecord = nlapiCreateRecord('customrecord_lmry_law360_state_acc_expen');
			newRecord.setFieldValue(arrFields[0], arrValues[0]);
			newRecord.setFieldValue(arrFields[1], arrValues[1]);
			newRecord.setFieldValue(arrFields[2], arrValues[2]);
			newRecord.setFieldValue(arrFields[3], arrValues[3]);
			newRecord.setFieldValue(arrFields[4], arrValues[4]);
			// Actualiza el nombre
		var nameproje = newRecord.getFieldText(arrFields[1]);
			newRecord.setFieldValue(arrFields[0], arrValues[2] + ' : '+ nameproje);
		idRecord  = nlapiSubmitRecord(newRecord);
 	} catch(err) {
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360CreateAccExp]', LMRY_script);
	}
	// Devuelve el resultado de la grabacion
	return idRecord;
}

/*****************************************************
 * Funcion para crear nuevo registro personalizado
 * "LatamReady - Law360 Expense"
 * arrValues	= Arreglo que contiene los nuevos 
 *				  valores para el registro a crear.
 *************************************************** */
function Law360CreateExpense(arrValues)
{
	// Grabacion exitosa
	var idRecord = 0;
	try{
		// Arreglo de campos
		var arrFields = new Array();
			arrFields[0] = 'custrecord_lmry_law360_expens_accsta'; 
			arrFields[1] = 'custrecord_lmry_law360_expens_type'; 
			arrFields[2] = 'custrecord_lmry_law360_expens_trasac'; 
			arrFields[3] = 'custrecord_lmry_law360_expens_secuen'; 
			arrFields[4] = 'custrecord_lmry_law360_expens_intern'; 
			arrFields[5] = 'custrecord_lmry_law360_expens_project'; 
			arrFields[6] = 'custrecord_lmry_law360_expens_date'; 
			arrFields[7] = 'custrecord_lmry_law360_expens_amount'; 
			arrFields[8] = 'custrecord_lmry_law360_expens_descri'; 
			arrFields[9] = 'custrecord_lmry_law360_expens_vendor'; 
			arrFields[10] = 'custrecord_lmry_law360_expens_billabe'; 
			arrFields[11] = 'custrecord_lmry_law360_expens_itemar'; 
			arrFields[12] = 'custrecord_lmry_law360_expens_rate'; 
			arrFields[13] = 'custrecord_lmry_law360_expens_period'; 
			arrFields[14] = 'custrecord_lmry_law360_expens_cusapp'; 
			arrFields[15] = 'custrecord_lmry_law360_expens_bilsta'; 
			arrFields[16] = 'custrecord_lmry_law360_expens_obstyp'; 
			arrFields[17] = 'custrecord_lmry_law360_expens_remcus'; 
			arrFields[18] = 'custrecord_lmry_law360_expens_langua'; 
			arrFields[19] = 'custrecord_lmry_law360_expens_remres'; 
			arrFields[20] = 'custrecord_lmry_law360_expens_tranexrate'; 
			arrFields[21] = 'custrecord_lmry_law360_expens_exrate'; 
			arrFields[22] = 'custrecord_lmry_law360_expens_jobcurrenc'; 
			arrFields[23] = 'custrecord_lmry_law360_expens_employee'; 

		// Busca si ya existe
		arrValues[24] = Law360SearchALinExp(arrValues[2], arrValues[3]);
		
		// Crea pediodo
		var newRecord = ''
			if (arrValues[24]=='' || arrValues[24]==null || arrValues[24]==0){
				newRecord = nlapiCreateRecord('customrecord_lmry_law360_expense');
			}else{
				newRecord = nlapiLoadRecord('customrecord_lmry_law360_expense', arrValues[24]);
			}
			newRecord.setFieldValue(arrFields[0], arrValues[0]);
			newRecord.setFieldText(arrFields[1], arrValues[1]);
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
			newRecord.setFieldValue(arrFields[22], arrValues[22]);
			newRecord.setFieldValue(arrFields[23], arrValues[23]);
		idRecord  = nlapiSubmitRecord(newRecord);

 	} catch(err) {
		// Envia correo de error al usuario
		law360_sendemail(err + ' [Law360CreateExpense]', LMRY_script);
	}
	// Devuelve el resultado de la grabacion
	return idRecord;
}