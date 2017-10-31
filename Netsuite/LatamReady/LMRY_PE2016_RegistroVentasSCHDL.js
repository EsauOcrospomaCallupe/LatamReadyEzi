/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Ago 2014     LatamReady Consultor
 * File : LMRY_PE2016_RegistroVentasSCHDL.js
 */
var objContext =  nlapiGetContext();
// Nombre del Reporte
var namereport = "Registro de Ventas";
var LMRY_script = 'LatamReady PE 2016 Registro Ventas SCHDL';
// Control de Memoria
var intMaxReg = 1000;
var intMinReg = 0;
var bolStop = false;
var intTotalRows = 0;
var intLoops = 1; 
// Control de P24
var strName = '';
var strName1 = '';
var strName2 = '';24
var strName3 = '';
var strName4 = '';
var cantpagi = 0;
var configpage = '';
var companyruc = '';
var companyname = '';
var formlogo = '';
var timezone = '';
var periodstartdate = '';
var periodenddate = '';
var periodname = '';
var ArrTransaccion = new Array();
var informacionPendiente = false;
var parainternal = '';

var	paramMultibook	=	null;	


//Valida si es OneWorld
var featuresubs	 =	objContext.getFeature('SUBSIDIARIES');
var feamultibook =	objContext.getFeature('MULTIBOOK');



/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled_main_registro_ventas_2016(type) {
	try {
		// Seteo de Porcentaje completo 
		objContext.setPercentComplete(0.00);
		
		// Valida si es OneWorld
		var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
	
		// Parametros
		var paramperiodo = objContext.getSetting('SCRIPT', 'custscript_lmry_periodo_reg_ventas_2016');
			parainternal = objContext.getSetting('SCRIPT', 'custscript_lmry_logid_reg_ventas_2016');
		var paramsubsidi = objContext.getSetting('SCRIPT', 'custscript_lmry_subs_reg_ventas_2016');
		var paraminshead = objContext.getSetting('SCRIPT', 'custscript_lmry_inshead_reg_ventas_2016');
		paramMultibook   = objContext.getSetting('SCRIPT', 'custscript_lmry_siguiente_multibook_2016');
		// Siguiente rango
		var paramnextpos = objContext.getSetting('SCRIPT', 'custscript_lmry_siguiente_registro_2016');
		if (paramnextpos!='' && paramnextpos!=null)
		{
			if (parseInt(paramnextpos)>0)
			{
				// Quiebre de 1000 en 1000
				intMinReg = parseInt(paramnextpos); 
				intMaxReg = parseInt(paramnextpos) + 1000;
			}
		}

		// Log de debbuger
		nlapiLogExecution('ERROR', 'Periodo, Internalid Log, Subsidiaria, paraminshead, paramnextpos: ', 
						  paramperiodo + ', ' + parainternal + ', ' + paramsubsidi + ', ' + paraminshead + ', ' + paramnextpos);
		
		if (!ValidateCountry(paramsubsidi)) {
			return true;
		}
	
		// Datos de la empresa
		configpage = nlapiLoadConfiguration('companyinformation');
		companyruc = '12345678901';
		companyname = configpage.getFieldValue('companyname');
		formlogo 	= configpage.getFieldValue('formlogo');
		timezone 	= configpage.getFieldValue('timezone');
	
		if (paramperiodo!=null && paramperiodo!=''){
		    var columnFrom = nlapiLookupField('accountingperiod', paramperiodo, ['enddate','periodname']);
		    //periodstartdate = columnFrom.startdate;
		    periodenddate = columnFrom.enddate;
		    periodname = columnFrom.periodname;
		    var anioperiodoend   = periodenddate.substr((periodenddate.length - 4), periodenddate.length);
		}
	
		// Cabecera de campos para el registro de ventas
	   	var cabecera = 'Periodo|Número correlativo del mes o Código Único de la Operación|Número correlativo del asiento contable identificado en el campo 2|'+
				   		'Fecha de emisión|Fecha de Vencimiento|Tipo de Comprobante|Número serie|Número comprobante|'+
				   		'Para efectos del registro de tickets o cintas emitidos por máquinas registradoras|Tipo de Documento de Identidad|Número de Documento de Identidad|'+
				   		'Apellidos y nombres, denominación o razón social|Valor facturado de la exportación|Base imponible de la operación gravada|'+
				   		'Descuento de la base imponible|Impuesto General a las Ventas|Descuento del Impuesto General a las Ventas y/o Impuesto de Promoción Municipal|'+
				   		'Importe total de la operación exonerada|Importe total de la operación inafecta|Impuesto Selectivo al Consumo|'+
				   		'Base imponible de la operación gravada con el Impuesto a las Ventas del Arroz Pilado|Impuesto a las Ventas del Arroz Pilado|'+
				   		'Otros conceptos, tributos y cargos que no forman parte de la base imponible|Importe total del comprobante de pago|Codigo de la moneda|Tipo de cambio|'+
				   		'Fecha de emisión del comprobante original|Tipo del comprobante de pago que se modifica|Número de serie del comprobante de pago que se modifica|'+
				   		'Número del comprobante de pago que se modifica|Identificación del Contrato o del proyecto |'+
				   		'Error tipo 1: inconsistencia en el tipo de cambio|Indicador de Comprobantes de pago cancelados con medios de pago|Estado que identifica la oportunidad de la anotación|';
	
		// Transaccion
		var savedsearch = nlapiLoadSearch('transaction', 'customsearch_lmry_pe_reg_ventas_2016');	
			savedsearch.addFilter(new nlobjSearchFilter('postingperiod', null, 'anyof', paramperiodo));
			// Valida si es OneWorld 
			if (featuresubs == true) {
				savedsearch.addFilter(new nlobjSearchFilter('subsidiary', null, 'is', paramsubsidi));
			}
			// Internal ID para Debug
			//savedsearch.addFilter(new nlobjSearchFilter('internalid', null, 'anyof', [3873819,3876915,3876919,3783518]));
		/////multibooking
			if ( (feamultibook == true || feamultibook == 'T') && (paramMultibook!='' && paramMultibook!=null) ){
				savedsearch.addFilter(new nlobjSearchFilter('accountingbook', 'accountingtransaction', 'anyof', paramMultibook));
			}/////////////////////
			
			var searchresult = savedsearch.runSearch();

		// Carga arreglo con todas las lineas consultadas
		var columns = new Array();
		var pos = 0;
		var swnext = false;
		while (!bolStop)
		{
			// Retorno de 1000 Registro
			var objResult = searchresult.getResults(intMinReg, intMaxReg);
			if (objResult!=null && objResult!='') {
				nlapiLogExecution('ERROR', 'CALCULANDO RANGO', intMinReg + ' - ' + intMaxReg);
				// Filas
				var intLength = objResult.length;
				for (var fil = 0; fil < intLength; fil++){
					columns = objResult[fil].getAllColumns();
					strName +=  objResult[fil].getValue(columns[0]) + '|' + objResult[fil].getText(columns[1])  + '|' + 
								objResult[fil].getValue(columns[2]) + '|' +	objResult[fil].getValue(columns[3]) + '|' + 
								objResult[fil].getValue(columns[4]) + '|' + objResult[fil].getValue(columns[5]) + '|' +
								objResult[fil].getValue(columns[6]) + '|' + objResult[fil].getValue(columns[7]) + '|' + 
								objResult[fil].getValue(columns[8]) + '|' + objResult[fil].getValue(columns[9]) + '|' + 
								objResult[fil].getValue(columns[10])+ '|' + objResult[fil].getValue(columns[11])+ '|' +
								objResult[fil].getValue(columns[12])+ '|' + objResult[fil].getValue(columns[13])+ '|' + 
								objResult[fil].getValue(columns[14])+ '|' +	objResult[fil].getValue(columns[15])+ '|' + 
								objResult[fil].getValue(columns[16])+ '|' + objResult[fil].getValue(columns[17])+ '|' + 
								objResult[fil].getValue(columns[18])+ '|' + objResult[fil].getValue(columns[19])+ '|' + 
								objResult[fil].getValue(columns[20])+ '|' + objResult[fil].getValue(columns[21])+ '|' + 
								objResult[fil].getValue(columns[22])+ '|' + objResult[fil].getValue(columns[23])+ '|' +
								objResult[fil].getValue(columns[24])+ '|' + objResult[fil].getValue(columns[25])+ '|' + 
								objResult[fil].getValue(columns[26])+ '|' +	objResult[fil].getValue(columns[27])+ '|' + 
								objResult[fil].getValue(columns[28])+ '|' + objResult[fil].getValue(columns[29])+ '|' + 
								objResult[fil].getValue(columns[30])+ '|' + objResult[fil].getValue(columns[31])+ '|' + 
								objResult[fil].getValue(columns[32])+ '|' + objResult[fil].getValue(columns[33])+ '|' + 
								objResult[fil].getValue(columns[34])+ '|' + objResult[fil].getValue(columns[35])+ '|' +
								objResult[fil].getValue(columns[36])+ '|' + objResult[fil].getValue(columns[37])+ '|' + 
								objResult[fil].getValue(columns[38])+ '|' +	objResult[fil].getValue(columns[39])+ '|' + 
								objResult[fil].getValue(columns[40])+ '|' + objResult[fil].getValue(columns[41])+ '|' + 
								objResult[fil].getValue(columns[42])+ '|';
					// Campo memo y Descuento Exonerada
					var memo = objResult[fil].getValue(columns[43]);
					if (memo!='' && memo!=null){
						memo = memo.substring(0, 4);
					}else{
						memo = '';
					}
					// Solo Descuentos 'E-PE'
					strName += memo + '|' + objResult[fil].getValue(columns[44]);
					// Solo Descuentos 'S-PE', 'SNop-PE', 'SNoc-PE', 'INoc-PE'
					strName += '|' + objResult[fil].getValue(columns[45]); 
					// Solo IGV Descuentos 'S-PE', 'SNop-PE', 'SNoc-PE', 'INoc-PE'
					strName += '|' + objResult[fil].getValue(columns[46]);
					// Fin de Linea
					strName += '|' + '\n';
					// Cantidad de Lineas
					pos++;
				}
				
				// Quiebre de 1000 en 1000
				intMinReg = intMaxReg; 
				intMaxReg += 1000;
				if (intLength<1000){
					bolStop = true;
				}
				if (intMinReg==40000 || intMinReg==80000)
				{
					swnext = true;
					break;
				}
			} else {
				bolStop = true;
			}
		}
		
		nlapiLogExecution('ERROR', 'Cantidad de Filas Cargadas', pos);
		
		// Varifica si hay informacion
		if (pos==0) {
		    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', parainternal);
		    	record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file' , '');
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', 'No existe informacion para los criterios seleccionados.');
			nlapiSubmitRecord(record, true);
	
			// Sale del proceso
			return true;
		}
		
		// Sumatoria de Columnas
		var columns13 = 0.00;
		var columns14 = 0.00;
		var columns15 = 0.00;
		var columns16 = 0.00;
		var columns17 = 0.00;
		var columns18 = 0.00;
		var columns19 = 0.00;
		var columns20 = 0.00;
		var columns21 = 0.00;
		var columns22 = 0.00;
		var columns23 = 0.00;
		var columns24 = 0.00;

		// Corre el contenido de la busqueda
		var contenidoCompleto =	strName.split('\n');
		var cantidadLineas 	  =	(contenidoCompleto.length - 1); 
		
		nlapiLogExecution('ERROR', 'CANTIDAD DE LINEAS DE LA BUSQUEDA', 'TOTAL DE LINEAS: ' + cantidadLineas);	
		
		for (var recorreLinea=0; recorreLinea<cantidadLineas; recorreLinea++)
		{
			var contenidoLinea 	= contenidoCompleto[recorreLinea].split('|');
			var memo = contenidoLinea[43]; // Memo
			var flag=false;
			/* -----------------------------------
			 * Crea el archivo TXT
			 * ---------------------------------*/ 
			//VACIO LA LINEA PARA REALIZAR DESPUES LA DIVISION
			strName = '';
			// 1 Periodo (Description)
			strName += Periodo(contenidoLinea[1],'');
			periodname = contenidoLinea[1];
			strName += "|";
			//Para la validacion de Boleteo
			if(contenidoLinea[9]=='- None -' || contenidoLinea[9]=='' || contenidoLinea[9]==null || contenidoLinea[9]=='ERROR: Field Not Found' || contenidoLinea[9]=='ERROR: no se encuentra el campo.'){
				flag=false;
			}else{
				flag=true;
			}
			// 2 Numero correlativo del Registro o codigo unico de la operacion
			strName += contenidoLinea[2];
			strName += "|";
			// 3 Numero correlativo del Registro o codigo unico de la operacion (Version mayo 2014 SUNAT)
			strName += contenidoLinea[3];
			strName += "|";
			// 4 Fecha de emision del comprobante de pago o documento
			strName += contenidoLinea[4];
			strName += "|";
			// 5 Fecha de Vencimiento o Fecha de Pago (1)
			if(tipoAux == '14'){
				// Recibo por servicios publicos de suministro de energia electrica etc.
				strName += contenidoLinea[5];
			}
			strName += "|";
			// 6 Tipo de Comprobante de Pago o Documento
			var tipoAux = contenidoLinea[6];
			if(tipoAux!='- None -'){
				strName += contenidoLinea[6];
			}
			strName += "|";
			// 7 Serie del comprobante de pago o documento. (Description)
			var serieAux = '';
			if(contenidoLinea[7]!='- None -'){
				serieAux = contenidoLinea[7];
			}
			if(tipoAux == '01' || tipoAux == '03' || tipoAux == '06' || tipoAux == '07' || tipoAux == '08'){
				strName += RellenaTexto(serieAux,4,'N');
			}else{
				strName += serieAux;
			}
			strName += "|";
			// 8 Numero del comprobante de pago o documento
			var numerAux = ''; 
			if(contenidoLinea[8]!='- None -'){
				numerAux = contenidoLinea[8];
			}
			strName += numerAux;
			strName += "|";

			// 9 en caso de optar por imp tot de las operaciones diarias q no otorguen derecho a credito fiscal
			if(flag){
				strName += contenidoLinea[9];
			}
			
			strName += "|";
			// 10 Tipo de Documento de Identidad del proveedor
			if(!flag){
				strName += contenidoLinea[10];
			}
			strName += "|";
			// 11 Numero de RUC del proveedor o numero de documento de Identidad, segun corresponda.
			if(!flag){
				strName += contenidoLinea[11];
			}
			
			strName += "|";
			// 12 Apellidos y nombres, denominacion o razon social  del proveedor. En caso de personas naturales
			var denominacion = contenidoLinea[12];
				denominacion = denominacion.replace('|',' ');
				denominacion = denominacion.replace('/',' ');
				denominacion = denominacion.replace(',',' ');
				denominacion = denominacion.replace('\r\n',' ');
				denominacion = denominacion.replace('\n\r',' ');
				denominacion = denominacion.replace('\n',' ');
				if(flag){denominacion = '';}
			strName += denominacion;
			strName += "|";
			var valorLineal = 0;
			// Descuento Exonerado
			var auxdescue = contenidoLinea[44];
			if (auxdescue=='' || auxdescue==null){
				auxdescue = 0;
			}
			// Descuentos No Exonerados
			var tmpdescue = contenidoLinea[45];
			if (tmpdescue=='' || tmpdescue==null){
				tmpdescue = 0;
			}
			// 13 EXPORTACION
			columns13 = parseFloat(contenidoLinea[20]);	
			valorLineal += columns13;
			// 14 GRAVADO  S-PE, SNOP-PE, SNOC-PE y INOC-PE + El descuento
			columns14 = (parseFloat(contenidoLinea[13]) + 
						parseFloat(contenidoLinea[16]) +
						parseFloat(contenidoLinea[17]) + 
						parseFloat(contenidoLinea[19]));
			if(contenidoLinea[42]!='CREDMEM'){
				// Le aumentamos el descuento
				//columns14 = (Math.abs(parseFloat(columns14))+Math.abs(contenidoLinea[45]));
				columns14 = (Math.abs(parseFloat(columns14))-Math.abs(contenidoLinea[45]));
			}
			valorLineal += columns14;
			// 15 DESCUENTO DE BASE IMPONIBLE - Ant 26
			columns15 = contenidoLinea[45];
			if(columns15==''||columns15==null){
				columns15 = 0;
			}
			columns15 = parseFloat(columns15)*-1;
			valorLineal += columns15;
			//IGV- Descuento
			var descuentoPE =parseFloat(contenidoLinea[46]);
			// 16 IGV
			columns16 = parseFloat(contenidoLinea[25]);
			columns16 = columns16+descuentoPE;
			valorLineal += columns16;
			// 17 DESCUENTO DE IGV (NETSUITE SOLO ES SOBRE EL IMP BRUTO)
			columns17 = descuentoPE*-1;
			valorLineal += columns17;
			// 18 EXONERACION
			if(contenidoLinea[42]=='CREDMEM'){
				columns18 = parseFloat(contenidoLinea[14]);
			}else{
				// Descuentos al 100% - Total igual a cero y descuento mayor a cero
				if (parseFloat(contenidoLinea[27])==0 && parseFloat(auxdescue)>0){
					columns18 = 0;
				}else{
					//columns18 = parseFloat(contenidoLinea[14]) - parseFloat(auxdescue);
					columns18 = parseFloat(contenidoLinea[14]);
				}
			}
			valorLineal += columns18;
			// 19 INAFECTO
			columns19 = parseFloat(contenidoLinea[23]);
			valorLineal += columns19;
			// 20 ISC
			columns20 = parseFloat('0');
			valorLineal += columns20;
			// 21 Base Imponible con Impuesto a las ventas del arroz pilado
			columns21 = parseFloat('0');
			valorLineal += columns21;
			// 22 Impuesto a las ventas del arroz pilado
			columns22 = parseFloat('0');
			valorLineal += columns22;
			// 23 OTROS
			columns23 = parseFloat(contenidoLinea[24]);
			valorLineal += columns23;
			// 24 TOTAL
			columns24 = parseFloat(contenidoLinea[27]);
			//var restante = 0;
			//if(valorLineal!=columns24 && parseFloat(auxdescue)==0){
			//	restante	=	valorLineal - columns24;
			//	columns15 	= 	restante;
			//}
			// Tipo de Transaccion
			//if(contenidoLinea[42]=='CREDMEM'){
			if (tipoAux=='07'){
				if(parseFloat(columns13)!=0){
					strName += "-"+Math.abs(columns13).toFixed(2);
				}else{
					strName += Math.abs(columns13).toFixed(2);
				}					
				strName += "|";
				if(parseFloat(columns14)!=0){
					strName += "-"+Math.abs(columns14).toFixed(2);
				}else{
					strName += Math.abs(columns14).toFixed(2);
				}	
				strName += "|";
				if(parseFloat(columns15)!=0){
					strName += "0.00";
				}else{
					strName += "0.00";
				}	
				strName += "|";
				if(parseFloat(columns16)!=0){
					strName += "-"+Math.abs(columns16).toFixed(2);
				}else{
					strName += Math.abs(columns16).toFixed(2);
				}	
				strName += "|";
				if(parseFloat(columns17)!=0){
					strName += "-"+Math.abs(columns17).toFixed(2);
				}else{
					strName += Math.abs(columns17).toFixed(2);
				}	
				strName += "|";
				if(parseFloat(columns18)!=0){
					strName += "-"+Math.abs(columns18).toFixed(2);
				}else{
					strName += Math.abs(columns18).toFixed(2);
				}
				strName += "|";
				if(parseFloat(columns19)!=0){
					strName += "-"+Math.abs(columns19).toFixed(2);
				}else{
					strName += Math.abs(columns19).toFixed(2);
				}
				strName += "|";
				if(parseFloat(columns20)!=0){
					strName += "-"+Math.abs(columns20).toFixed(2);
				}else{
					strName += Math.abs(columns20).toFixed(2);
				}	
				strName += "|";	
				if(parseFloat(columns21)!=0){
					strName += "-"+Math.abs(columns21).toFixed(2);
				}else{
					strName += Math.abs(columns21).toFixed(2);
				}
				strName += "|";
				if(parseFloat(columns22)!=0){
					strName += "-"+Math.abs(columns22).toFixed(2);
				}else{
					strName += Math.abs(columns22).toFixed(2);
				}	
				strName += "|";
				if(parseFloat(columns23)!=0){
					strName += "-"+Math.abs(columns23).toFixed(2);
				}else{
					strName += Math.abs(columns23).toFixed(2);
				}	
				strName += "|";
				if(parseFloat(columns24)!=0){
					strName += "-"+Math.abs(columns24).toFixed(2);	
				}else{
					strName += Math.abs(columns24).toFixed(2);	
				}
				strName += "|";
			}else{
				strName += parseFloat(Math.abs(columns13)).toFixed(2);
				strName += "|";
				strName += parseFloat(Math.abs(columns14)).toFixed(2);	
				strName += "|";
				strName += parseFloat(Math.abs(columns15)*-1).toFixed(2);	
				strName += "|";
				strName += parseFloat(Math.abs(columns16)).toFixed(2);	
				strName += "|";
				strName += parseFloat(Math.abs(columns17)*-1).toFixed(2);	
				strName += "|";
				strName += parseFloat(Math.abs(columns18)).toFixed(2);
				strName += "|";
				strName += parseFloat(Math.abs(columns19)).toFixed(2);
				strName += "|";
				strName += parseFloat(Math.abs(columns20)).toFixed(2);	
				strName += "|";	
				strName += parseFloat(Math.abs(columns21)).toFixed(2);
				strName += "|";
				strName += parseFloat(Math.abs(columns22)).toFixed(2);	
				strName += "|";
				strName += parseFloat(Math.abs(columns23)).toFixed(2);
				strName += "|";
				strName += parseFloat(Math.abs(columns24)).toFixed(2);	
				strName += "|";
			}
			// 25 Moneda
			strName += contenidoLinea[28];
			strName += "|";
			// 26 Tipo de Cambio
			strName += contenidoLinea[29];
			strName += "|";
			/***************************************************
			 * Tipo de documento de Referencia
			 * 	07 = Nota de credito
			 *  08 = Nota de debito
			 * 	87 = Nota de credito Especial
			 *  88 = Nota de debito Especial
			 **************************************************/ 
			if (tipoAux=='07' || tipoAux=='08' || tipoAux=='87' || tipoAux=='88') {
				// Fecha Documento Referencia
				if (contenidoLinea[30]=='- None -' || contenidoLinea[30]==''){
					strName += "|";
				}else{
					var auxiliarFecha = contenidoLinea[30];
					if(auxiliarFecha.length>4){
						var auxiliarFechaAux	= auxiliarFecha.split('/');
						var finalAux = '';
						if(auxiliarFechaAux[0].length==1){
							finalAux = '0'+auxiliarFechaAux[0]+'/';
						}else{
							finalAux = auxiliarFechaAux[0]+'/';
						}
						if(auxiliarFechaAux[1].length==1){
							finalAux = finalAux+'0'+auxiliarFechaAux[1]+'/';
						}else{
							finalAux = finalAux+auxiliarFechaAux[1]+'/';
						}
						finalAux = finalAux+auxiliarFechaAux[2];
						strName += finalAux;
					}else{
						strName += contenidoLinea[30];
					}
					strName += "|";
				}
				// Tipo de documento de Referencia
				if (contenidoLinea[31]=='- None -' || contenidoLinea[31]==''){
					strName += "|";
				}else{
					strName += contenidoLinea[31];
					strName += "|";
				}
				// Numero de Serie de Referencia
				if (contenidoLinea[32]=='- None -' || contenidoLinea[32]==''){
					strName += "|";
				}else{
					strName += RellenaTexto(contenidoLinea[32],4,'N');
					strName += "|";
				}
				// Numero de Documento de Referencia
				if (contenidoLinea[33]=='- None -' || contenidoLinea[33]==''){
					strName += "|";
				}else{
					strName += contenidoLinea[33];
					strName += "|";
				}
			} else {
				strName += "|";
				strName += "|";
				strName += "|";
				strName += "|";
			}
			if (contenidoLinea[34]=='- None -' || contenidoLinea[34]==''){
				strName += "|";
			}else{
				strName += contenidoLinea[34];
				strName += "|";
			}
			strName += contenidoLinea[35];	
			strName += "|";
			strName += contenidoLinea[36];	
			strName += "|";
			
			// Comparacion de Fechas
			var dFecTra = contenidoLinea[37];	// Fecha
			var dFecIni = contenidoLinea[38];	// Periodo Inicial
			var dFecFin = contenidoLinea[39];	// Periodo Final
			var dFecAnt = contenidoLinea[40];	// 12 meses Anteriores al Periodo
			var dDocRec = contenidoLinea[41];	// Es rectificacion (Description)
			if (dDocRec=='- None -'){
				dDocRec = '';
			}
			if(memo=='VOID'){
				strName += "2";
			}else{
				// Fecha Emision>=Periodo Inicial y  Fecha Emision<=Periodo Final
				if ((dFecTra >= dFecIni && dFecTra <= dFecFin) && dDocRec!='Si') {
					strName += "1";
				}else{
					// Dentro de los 12 meses del Periodo Actual
					if ((dFecTra >= dFecAnt) && (dFecTra <= dFecIni) && (dDocRec!='Si')) {
						strName += "6";
					}
					if ((dFecTra < dFecAnt)  && (dDocRec != 'Si')) {
						strName += "7";
					}
					if (dDocRec=='Si') {
						strName += "9";
					}
				}
			}
			strName += "|";
			
			// Fin de Linea
			strName += "\n";
			
			// inicializa variable
			columns13 = 0.00;	
			columns14 = 0.00;	
			columns15 = 0.00;	
			columns16 = 0.00;	
			columns17 = 0.00;	
			columns18 = 0.00;	
			columns19 = 0.00;	
			columns20 = 0.00;	
			columns21 = 0.00;
			columns22 = 0.00;
			columns23 = 0.00;
			columns24 = 0.00;
			
			// Los archivos se generan solo de 25000 Lineas
			if (recorreLinea<25000) { strName1 += strName; }
			if (recorreLinea>=25000 && recorreLinea<50000) { strName2 += strName; }
			if (recorreLinea>=50000 && recorreLinea<75000) { strName3 += strName; }
			if (recorreLinea>=75000) { strName4 += strName; }
		}
		// Reemplaza nones
		strName1 = strName1.replace(/- None -/gi,' ');
		strName2 = strName2.replace(/- None -/gi,' ');
		strName3 = strName3.replace(/- None -/gi,' ');
		strName4 = strName4.replace(/- None -/gi,' ');
		
		// Insert cabecera
		if ( strName1!='' && strName1!=null && paraminshead=='T') {
			strName1 = cabecera + "\n" + strName1;
		}
		if ( strName2!='' && strName2!=null && paraminshead=='T') {
			strName2 = cabecera + "\n" + strName2;
		}	
		if ( strName3!='' && strName3!=null && paraminshead=='T') {
			strName3 = cabecera + "\n" + strName3;
		}			
		if ( strName4!='' && strName4!=null && paraminshead=='T') {
			strName4 = cabecera + "\n" + strName4;
		}			
		nlapiLogExecution('ERROR', 'Pasa a la siguiente funcion', 'savefile');
		
		// Crea y graba el archivo PDF
		savefile(paramsubsidi, paraminshead);

		/*****************************
		 * Rellamado del script 
		 *****************************/ 
		if (swnext == true)
		{
			// Creacion de la linea en el log de errores
			var record = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', 'Siguiente Proceso ....');
				record.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'Registro de Ventas Electronico 2016' );
				record.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
				if (featuresubs == true || featuresubs == 'T') //EN ALGUNAS INSTANCIAS DEVUELVE CADENA OTRAS DEVUELVE BOOLEAN
				{
					// Trae el nombre de la subsidiaria
					var subsidiary = nlapiLookupField('subsidiary', paramsubsidi, 'name');
					record.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', paramsubsidi);
				}
				record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', '');
				record.setFieldValue('custrecord_lmry_pe_2016_rg_employee', objContext.getName() );
			var rec_id = nlapiSubmitRecord(record, true);

			// Parametros
			var arrParam = new Array();
				arrParam['custscript_lmry_periodo_reg_ventas_2016'] = paramperiodo;
				arrParam['custscript_lmry_logid_reg_ventas_2016']	= rec_id;
				arrParam['custscript_lmry_subs_reg_ventas_2016']	= paramsubsidi;
				arrParam['custscript_lmry_inshead_reg_ventas_2016']	= paraminshead;
				arrParam['custscript_lmry_siguiente_registro_2016']	= intMinReg;

			var status = nlapiScheduleScript('customscript_lmry_pe_2016_reg_vent_schdl', 'customdeploy_lmry_pe_2016_reg_vent_schdl', arrParam);	
		}
	} catch(err) {
		nlapiLogExecution('ERROR', 'Se cancelo por error. Linea - ' + recorreLinea, err);

		// Actualiza el Log del reporte
	    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', parainternal);
			record.setFieldValue('custrecord_lmry_pe_2016_rg_name', 'Reporte cancelado.');
		nlapiSubmitRecord(record, true);
		
		// Envio de correo de error al usuario
		sendemail('scheduled_main - Error: ' + err, LMRY_script);
	}	
	
	nlapiLogExecution('ERROR', 'El proceso', 'Termino');

	// Fin
	return true;
}

/* 
 * Valida que la sub sidiaria se Peru 
 */
function ValidateCountry(subsidiari) {
	try{
		var country = '';
		if (subsidiari != '' && subsidiari != null) {
			country = nlapiLookupField('subsidiary', subsidiari, 'country');
		} else {
			country = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_country_code_stlt');
		}
		if (country == 'PE') {
			return true;
		}
	
		nlapiLogExecution('ERROR', 'ValidateCountry', country);

	}catch(err){
		sendemail(' [ ValidateCountry ] ' +err, LMRY_script);
	}
	return false;
}

//-------------------------------------------------------------------------------------------------------	
// Graba el archivo en el Gabinete de Archivos
//-------------------------------------------------------------------------------------------------------
function savefile(paramsubsidi, paraminshead){
	// Valida si es OneWorld
	var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');

	// Ruta de la carpeta contenedora
	var FolderId = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_pe_2016_rg_file_cabinet');

	// Almacena en la carpeta de Archivos Generados
	if (FolderId!='' && FolderId!=null) {
		// Extension del archivo
		var fileext = '.txt';
		if ( paraminshead=='T' ) 
		{
			fileext = '.csv';
			
			// Reemplaza la coma por blank space
			strName1 = strName1.replace(/[,]/gi,' ');
			// Reemplaza la pipe por coma
			strName1 = strName1.replace(/[|]/gi,',');
			if(strName2!=''){
				// Reemplaza la coma por blank space
				strName2 = strName2.replace(/[,]/gi,' ');
				// Reemplaza la pipe por coma
				strName2 = strName2.replace(/[|]/gi,',');
			}
			if(strName3!=''){
				// Reemplaza la coma por blank space
				strName3 = strName3.replace(/[,]/gi,' ');
				// Reemplaza la pipe por coma
				strName3 = strName3.replace(/[|]/gi,',');
			}
			if(strName4!=''){
				// Reemplaza la coma por blank space
				strName4 = strName4.replace(/[,]/gi,' ');
				// Reemplaza la pipe por coma
				strName4 = strName4.replace(/[|]/gi,',');
			}
		}
		// Genera el nombre del archivo
		var FileName = Name_File(paramsubsidi);
		var NameFile =  FileName + '(1)' + fileext;
		var NameFile2 = FileName + '(2)' + fileext;
		var NameFile3 = FileName + '(3)' + fileext;
		var NameFile4 = FileName + '(4)' + fileext;
		
		// Crea el archivo
		var File = nlapiCreateFile(NameFile, 'PLAINTEXT', strName1);	
			File.setFolder(FolderId);
		// Termina de grabar el archivo
		var idfile = nlapiSubmitFile(File);
		// Trae URL de archivo generado
		var idfile2 = nlapiLoadFile(idfile);
	
		// Segundo archivo generado
		if(strName2!=''){
			var File2 = nlapiCreateFile(NameFile2, 'PLAINTEXT', strName2);	
			 	File2.setFolder(FolderId);
			// Termina de grabar el archivo
			var idfile_2 = nlapiSubmitFile(File2);
			// Trae URL de archivo generado
			var idfile2_2 = nlapiLoadFile(idfile_2);
		}
		
		// Tercer archivo generado
		if(strName3!=''){
			var File3 = nlapiCreateFile(NameFile3, 'PLAINTEXT', strName3);	
				File3.setFolder(FolderId);
			// Termina de grabar el archivo
			var idfile_3 = nlapiSubmitFile(File3);
			// Trae URL de archivo generado
			var idfile2_3 = nlapiLoadFile(idfile_3);
		}			
			
		// Cuarto archivo generado
		if(strName4!=''){
			var File4 = nlapiCreateFile(NameFile4, 'PLAINTEXT', strName4);	
				File4.setFolder(FolderId);
			// Termina de grabar el archivo
			var idfile_4 = nlapiSubmitFile(File4);
			// Trae URL de archivo generado
			var idfile2_4 = nlapiLoadFile(idfile_4);
		}			

		var urlfile = '';
		var urlfile_2 = '';
		var urlfile_3 = '';
		var urlfile_4 = '';

		// Obtenemo de las prefencias generales el URL de Netsuite (Produccion o Sandbox)
		var getURL = objContext.getSetting('SCRIPT', 'custscript_lmry_netsuite_location');
		if (getURL!='' && getURL!=''){
			urlfile   = 'https://' + getURL;
			urlfile_2 = 'https://' + getURL;
			urlfile_3 = 'https://' + getURL;
			urlfile_4 = 'https://' + getURL;
		}

		// Asigna el URL al link del log de archivos generados
		urlfile += idfile2.getURL();
		if(strName2!=''){
			urlfile_2 += idfile2_2.getURL();
		}
		if(strName3!=''){
			urlfile_3 += idfile2_3.getURL();
		}
		if(strName4!=''){
			urlfile_4 += idfile2_4.getURL();
		}
		
		//Genera registro personalizado como log
		if(idfile) {
			var usuario = objContext.getName();
			var subsidi = '';
			// Valida si es OneWorld 
			if (featuresubs == false){
				var company = nlapiLoadConfiguration('companyinformation'); 
				var	namecom = company.getFieldValue('companyname');
					company = null;
				subsidi = namecom;
			}else{
				if (paramsubsidi!=null && paramsubsidi!='') {
					subsidi = nlapiLookupField('subsidiary', paramsubsidi, 'legalname');
				}
			}
			var tmdate = new Date();
		    var myDate = nlapiDateToString(tmdate);
		    var myTime = nlapiDateToString(tmdate, 'timeofday');                
		    var current_date = myDate + ' ' + myTime;
		    var myfile = NameFile;
		    
		    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', parainternal);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'Registro de Ventas Electronico 2016');
				record.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
				if (subsidi!='' && subsidi!=null){
					record.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
				}else{
					subsidi = record.getFieldValue('custrecord_lmry_pe_2016_rg_subsidiary');
				}
				record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
			nlapiSubmitRecord(record, true);
			
			if(strName2!=''){
				var record2 = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile2);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'Registro de Ventas Electronico 2016');
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile_2);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
				nlapiSubmitRecord(record2, true);
				
				myfile = myfile + '\n\r' + NameFile2;
			}
			if(strName3!=''){
				var record3 = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile3);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'Registro de Ventas Electronico 2016');
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile_3);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
				nlapiSubmitRecord(record3, true);
				
				myfile = myfile + '\n\r' + NameFile3;
			}
			if(strName4!=''){
				var record4 = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
					record4.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile4);
					record4.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'Registro de Ventas Electronico 2016');
					record4.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
					record4.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
					record4.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile_4);
					record4.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
				nlapiSubmitRecord(record4, true);
				
				myfile = myfile + '\n\r' + NameFile4;
			}

			// Envia mail de conformidad al usuario
			sendrptuser('PE - Registro de Ventas', 3, myfile);
		}
	} else {
		// Debug
		nlapiLogExecution('ERROR', 'Creacion de PDF', 'No existe el folder');
	}
}

//-------------------------------------------------------------------------------------------------------	
// Nombre del Archivo
//-------------------------------------------------------------------------------------------------------
function Name_File(paramsubsidi) {
	var temp_date = new Date();
	var myTime = nlapiDateToString(temp_date, 'timeofday');                
	var GMTtime = calcTime('-6');
	var DateTT = GMTtime.getTime();
	var DateHH = GMTtime.getHours();
	var DateMM = GMTtime.getMinutes();
	var DateSS = GMTtime.getSeconds();

	var NameTime = DateHH.toString()+DateMM.toString()+DateSS.toString();
	
	// Numero de RUC
	var NroRuc = '';
	// Valida si es OneWorld 
	if ( nlapiGetContext().getFeature('SUBSIDIARIES')==true || nlapiGetContext().getFeature('SUBSIDIARIES')=='T') {
		var record = nlapiLoadRecord('subsidiary', paramsubsidi);
		NroRuc = record.getFieldValue('federalidnumber');
		record = null;
	}else{
		var company = nlapiLoadConfiguration('companyinformation');
		NroRuc = company.getFieldValue('employerid');
		company = null;
	}

	// Aï¿½o y Mes
	var fileano = periodenddate.substr((periodenddate.length - 4), periodenddate.length);
	var filemes = Periodo(periodname, 1);
	
	/* ----------
	Nombre del Archivo - LE RRRRRRRRRRR AAAA MM 00 140100 00 O I M 1.TXT
	01-02 = 'LE'
	03-13 = RRRRRRRRRRR = RUC
	14-17 = AAAA
	18-19 = MM
	20-21 = DD
	22-27 = LLLLLL = Identificador del libro
	28-29 = CC	   = Cï¿½digo de oportunidad de presentaciï¿½n del EEFF, aplica al Libro de Inventarios y Balances, para los demï¿½s consigne '00'
	30-30 = O	   = Indicador de operaciones
	31-31 = I	   = Indicador del contenido del libro o registro
	32-32 =	M	   = Indicador de la moneda utilizada
	33-33 = G	   = Indicador de libro electrï¿½nico generado por el PLE
	---------- */
	NameFile = 'LE' + NroRuc + fileano + filemes + '00' + '140100' + '00' + '1' + '1' + '1' + '1' + '_' + NameTime;
	
	// Return File Name as a string
	return NameFile;
}

//-------------------------------------------------------------------------------------------------------	
// Formato de la fecha
//-------------------------------------------------------------------------------------------------------
function calcTime(offset) {
    // create Date object for current location
    d = new Date();
    // convert to msec
    // add local time zone offset 
    // get UTC time in msec
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // create new Date object for different city
    // using supplied offset
    nd = new Date(utc + (3600000*offset));
    // return time as a string
    return nd;
}

//-------------------------------------------------------------------------------------------------------	
// Fecha de proceso
//-------------------------------------------------------------------------------------------------------	
function Periodo(period_name, opc) {
// Variables auxiliares
var auxfech = '';
var auxanio = '';
var auxmess = '';
	
	auxanio= period_name.substring(4);
	switch (period_name.substring(0, 3)) {
	  case 'Ene':
		  auxmess = '01';
		  break;
	  case 'ene':
		  auxmess = '01';
		  break;
	  case 'Jan':
		  auxmess = '01';
		  break;
	  case 'jan':
		  auxmess = '01';
		  break;
	  case 'Feb':
		  auxmess = '02';
		  break;
	  case 'feb':
		  auxmess = '02';
		  break;
	  case 'Mar':
		  auxmess = '03';
		  break;
	  case 'mar':
		  auxmess = '03';
		  break;
	  case 'Abr':
		  auxmess = '04';
		  break;
	  case 'abr':
		  auxmess = '04';
		  break;
	  case 'Apr':
		  auxmess = '04';
		  break;
	  case 'apr':
		  auxmess = '04';
		  break;
	  case 'May':
		  auxmess = '05';
		  break;
	  case 'may':
		  auxmess = '05';
		  break;
	  case 'Jun':
		  auxmess = '06';
		  break;
	  case 'jun':
		  auxmess = '06';
		  break;
	  case 'Jul':
		  auxmess = '07';
		  break;
	  case 'jul':
		  auxmess = '07';
		  break;
	  case 'Ago':
		  auxmess = '08';
		  break;
	  case 'ago':
		  auxmess = '08';
		  break;
	  case 'Aug':
		  auxmess = '08';
		  break;
	  case 'aug':
		  auxmess = '08';
		  break;
	  case 'Set':
		  auxmess = '09';
		  break;
	  case 'set':
		  auxmess = '09';
		  break;
	  case 'Sep':
		  auxmess = '09';
		  break;
	  case 'sep':
		  auxmess = '09';
		  break;
	  case 'Oct':
		  auxmess = '10';
		  break;
	  case 'oct':
		  auxmess = '10';
		  break;
	  case 'Nov':
		  auxmess = '11';
		  break;
	  case 'nov':
		  auxmess = '11';
		  break;
	  case 'Dic':
		  auxmess = '12';
		  break;
	  case 'dic':
		  auxmess = '12';
		  break;
	  case 'Dec':
		  auxmess = '12';
		  break;
	  case 'dec':
		  auxmess = '12';
		  break;
	  default:
		  auxmess = '00';
		  break;
	}
	if (opc=='' || opc==null) {
		auxfech = auxanio + auxmess + '00';
	} else {
		auxfech = auxmess;
	}
	return auxfech;
}

//-------------------------------------------------------------------------------------------------------	
//Concadena al aux un caracter segun la cantidad indicada
//-------------------------------------------------------------------------------------------------------
function RellenaTexto(aux, TotalDigitos, TipoCaracter) {
	var Numero = aux.toString();
	var mon_len = parseInt(TotalDigitos) - Numero.length;
	
	if (mon_len<0) { 
		mon_len = mon_len * -1;
	}
	// Solo para el tipo caracter
	if (TipoCaracter == 'C') {
		mon_len = parseInt(mon_len) + 1;
	}
	
	if (Numero == null || Numero == '') {
		Numero = '';
	} 

	var pd = '';
	if (TipoCaracter == 'N') {
		pd = repitechar(TotalDigitos,'0');
	} else {
		pd = repitechar(TotalDigitos,' ');
	}
	if (TipoCaracter == 'N') {
		// Numero = pd.substring(0, mon_len) + Numero;
		TotalDigitos = parseFloat(TotalDigitos) * -1;
		Numero = (pd + Numero).slice(TotalDigitos);
		return Numero;
	} else {
		Numero = Numero + pd;
		return Numero.substring(0, parseInt(TotalDigitos));
	}
}

//-------------------------------------------------------------------------------------------------------
//Replica un caracter segun la cantidad indicada
//-------------------------------------------------------------------------------------------------------
function repitechar(cantidad, carac) {
	var caracter = carac;
	var numero = parseInt(cantidad);
	var cadena = '';
	for ( var r = 0; r < numero; r++) {
		cadena += caracter;
	}
	return cadena;
}