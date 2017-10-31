/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 feb 2016    LatamReady Consultor
 * File: LMRY_PE2016_RegistroComprasSCHDL.js
 */
var objContext =  nlapiGetContext();
var LMRY_script = 'LMRY PE Registro Compras 2016 SCHDL';
// Nombre del Reporte
var namereport = "PE - Registro de Compras 2016 ";
// Control de Memoria
var intMaxReg = 1000;
var intMinReg = 0;
var bolStop = false;
var intTotalRows = 0;
var intLoops = 1; 
// Control de PDF
var strName = '';
var strName1 = '';
var strName2 = '';
var strName3 = '';
var cantpagi = 0;
var configpage = '';
var companyruc = '';
var companyname = '';
var formlogo = '';
var timezone = '';
var periodstartdate = '';
var periodenddate = '';
var periodname = '';
var activeExpRep = null;
var ArrTransaccion = new Array();
var featuresubs = '';
var cabecera = 'PERIODO|CORRELATIVO1|CORRELATIVO2|FECHA EMISION|FECHA VENCIMIENTO|TIPO COMPROBANTE|SERIE|' +
				'EMISION DUA|PREIMPRESO|IMPORTE TOTAL OPERACIONES SIN DERECHO CREDITO FISCAL|TIPO DOC IDENTIDAD|NUMERO DOC IDENTIDAD|NOMBRE LEGAL PROVEEDOR|'+
				'BASE IMPONIBLE DE LAS ADQUISICIONES GRAVADAS EN OP GRAVADAS|MONTO DEL IMPUESTO GENERAL A LAS VENTAS|BASE IMPONIBLE DE LAS ADQUISICIONES GRAVADAS EN OP GRAVADAS Y NO GRAVADAS|MONTO DEL IMPUESTO GENERAL A LAS VENTAS|' +
				'BASE IMPONIBLE DE LAS ADQUISICONES GRAVADAS QUE NO DAN DERECHO A CREDITO FISCAL|MONTO DEL IMPUESTO GENERAL A LAS VENTAS|'+
				'VALOR ADQUISICIONES NO GRAVADAS|ISC|OTROS TRIBUTOS Y CARGOS|IMPORTE TOTAL|CODIGO DE LA MONEDA|TIPO DE CAMBIO|FECHA DE EMISION DEL COMPROBANTE DE PAGO|TIPO DE COMPROBANTE DE PAGO |'+
				'NUMERO DE SERIE DEL COMPROBANTE DE PAGO|CODIGO DEPENDENCIA ADUANERA| NUMERO DEL COMPROBANTE DE PAGO|FECHA DE EMISION DE LA CONSTANCIA DE DEPOSITO DE DETRACCION|' +
				'NUMERO DE LA CONSTANCIA DE DEPOSITO DE DETRACCION|MARCA DEL COMPROBANTE DE PAGO SUJETO A RETENCION|CLASIFICACION DE LOS BIENES Y SERVICIOS|IDENTIFICACION DEL CONTRATO O DEL PROYECTO|' +
				'INCONSISTENCIA EN EL TIPO DE CAMBIO|INCONSISTENCIA POR PROVEEDORES NO HABIDOS|INCONSISTENCIA POR PROVEEDORES|INCONSISTENCIA POR DNIS|' +
				'INDICADOR DE COMPROBANTES DE PAGO CANCELADOS CON MEDIOS DE PAGO|ESTADO QUE IDENTIFICA LA OPORTUNIDAD DE LA ANOTACION\n';
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
var	paramMultibook	=	null;	


//Valida si es OneWorld
var featuresubs	 =	objContext.getFeature('SUBSIDIARIES');
var feamultibook =	objContext.getFeature('MULTIBOOK');





function scheduled_main(type) {
    // Seteo de Porcentaje completo 
	//return true;
	objContext.setPercentComplete(0.00);
	
	// Valida si es OneWorld
	featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');

	// Valida si tiene activo modulo Expense Reports
	activeExpRep = 'T';//objContext.getSetting('SCRIPT', 'custscript_expense_reports_activado');
	
	// Parametros
	var paramperiodo = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_2016_periodo');
	var paramrecolog = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_2016_interna');
	var paramsubsidi = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_2016_subsidi');
	var paraminshead = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_2016_inshead');
	paramMultibook	=	objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_2016_multibooking');
	
	// Mensaje al Debug
	nlapiLogExecution('ERROR', 'Periodo, Id Log, Subsidiaria, paraminshead: ', paramperiodo + ', ' + paramrecolog + ', ' + paramsubsidi + ', ' + paraminshead);
	
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

	// Variable auxiliar
	var straux = '';
	// Exedio las unidades
	var usager = false;
	
	try {
		// Sumatoria de Columnas
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
		var coltaxcod = '0';
		
		var auxid = 0;
		var columns = new Array(); 
		
		// Transaccion - LatamReady - PE 2016 Registro de Compras
		var savedsearch = nlapiLoadSearch('transaction', 'customsearch_lmry_pe2016_reg_compras');	
			savedsearch.addFilter(new nlobjSearchFilter('postingperiod', null, 'anyof', paramperiodo));
			// Valida si es OneWorld 
			if (featuresubs == true) {
				savedsearch.addFilter(new nlobjSearchFilter('subsidiary', null, 'is', paramsubsidi));
			}
////////////////multibooking
			if ( (feamultibook == true || feamultibook == 'T') && (paramMultibook!='' && paramMultibook!=null) ){
				savedsearch.addFilter(new nlobjSearchFilter('accountingbook', 'accountingtransaction', 'anyof', paramMultibook));
			}/////////////////////
			
		var searchresult = savedsearch.runSearch();
		
		// Carga arreglo con todas las lineas consultadas
		var pos = 0;
		while (!bolStop)	
		{
			// Mensaje al Debug
			nlapiLogExecution('ERROR', 'CALCULANDO RANGO', intMinReg + ' - ' + intMaxReg);
			
			// Trae las siguiente 1000 Lineas 
			var objResult = searchresult.getResults(intMinReg, intMaxReg);
			if (objResult!=null && objResult!='')
			{
				// Filas
				intLength = objResult.length
				for (var fil = 0; fil < intLength; fil++)
				{
					/************************************************
					 * Se valida en campo standart de NetSuite
					 * Billing Country columna 48 en la busqueda
					 * personalizada.
					 ***********************************************/
					var billcoun = objResult[fil].getValue(columns[48]);
					if (billcoun=='PE' || billcoun=='' || billcoun==null)
					{
						// Columnas
						var ArrComuns = new Array();
							columns = objResult[fil].getAllColumns();
						
						/************************************************
						 * Excluye los siguientes documentos :
						 * 02 = Recibo por Honorarios
						 * 91 = Comprobante de No Domiciliado
						 * 97 = Nota de Credito - No Domiciliado
						 * 98 = Nota de Debito - No Domiciliado
						 ***********************************************/
						var tipdoc = objResult[fil].getValue(columns[6]);
						if (tipdoc!='02' && tipdoc!='91' && tipdoc!='97' && tipdoc!='98'){
							/*********************************************
							 * Columna 1 Periodo
							 ********************************************/
							ArrComuns[0] = objResult[fil].getValue(columns[0]);
							ArrComuns[1] = objResult[fil].getText(columns[1]);
							ArrComuns[2] = objResult[fil].getValue(columns[2]);
							ArrComuns[3] = objResult[fil].getValue(columns[3]);
							ArrComuns[4] = objResult[fil].getValue(columns[4]);
							ArrComuns[5] = objResult[fil].getValue(columns[5]);
							ArrComuns[6] = objResult[fil].getValue(columns[6]);
							ArrComuns[7] = objResult[fil].getValue(columns[7]);
							ArrComuns[8] = objResult[fil].getValue(columns[8]);
							ArrComuns[9] = objResult[fil].getValue(columns[9]);
							ArrComuns[10] = objResult[fil].getValue(columns[10]);
							ArrComuns[11] = objResult[fil].getValue(columns[11]);
							ArrComuns[12] = objResult[fil].getValue(columns[12]);
							ArrComuns[13] = objResult[fil].getValue(columns[13]);
							// Tipo de Cuenta
							var typeacc = objResult[fil].getValue(columns[47]);
								typeacc = typeacc.toUpperCase();
							// Solo para la columna de importes 14 a la 22
							/* Solo en el caso de que la base imponible este negativo 
								ingresa a este criterio - OTHER CURRENT ASSET			*/
							if ( (typeacc=='INCOME'   || typeacc=='OTHER INCOME' ||
								  typeacc=='INGRESOS' || typeacc=='OTROS INGRESOS') ||							
								( (typeacc=='OTHER CURRENT ASSET' || typeacc=='OTROS ACTIVOS CIRCULANTES') 
								   && objResult[fil].getValue(columns[14])<0) ){
								ArrComuns[14] = Math.abs(objResult[fil].getValue(columns[14]))*-1;
								ArrComuns[15] = Math.abs(objResult[fil].getValue(columns[15]))*-1;
								ArrComuns[16] = Math.abs(objResult[fil].getValue(columns[16]))*-1;
								ArrComuns[17] = Math.abs(objResult[fil].getValue(columns[17]))*-1;
								ArrComuns[18] = Math.abs(objResult[fil].getValue(columns[18]))*-1;
								ArrComuns[19] = Math.abs(objResult[fil].getValue(columns[19]))*-1;
								ArrComuns[20] = Math.abs(objResult[fil].getValue(columns[20]))*-1;
								ArrComuns[21] = Math.abs(objResult[fil].getValue(columns[21]))*-1;
								ArrComuns[22] = Math.abs(objResult[fil].getValue(columns[22]))*-1;
							}else{
								ArrComuns[14] = Math.abs(objResult[fil].getValue(columns[14]));
								ArrComuns[15] = Math.abs(objResult[fil].getValue(columns[15]));
								ArrComuns[16] = Math.abs(objResult[fil].getValue(columns[16]));
								ArrComuns[17] = Math.abs(objResult[fil].getValue(columns[17]));
								ArrComuns[18] = Math.abs(objResult[fil].getValue(columns[18]));
								ArrComuns[19] = Math.abs(objResult[fil].getValue(columns[19]));
								ArrComuns[20] = Math.abs(objResult[fil].getValue(columns[20]));
								ArrComuns[21] = Math.abs(objResult[fil].getValue(columns[21]));
								ArrComuns[22] = Math.abs(objResult[fil].getValue(columns[22]));
							}
							ArrComuns[23] = objResult[fil].getValue(columns[23]);
							ArrComuns[24] = objResult[fil].getValue(columns[24]);
							ArrComuns[25] = objResult[fil].getValue(columns[25]);
							ArrComuns[26] = objResult[fil].getValue(columns[26]);
							ArrComuns[27] = objResult[fil].getValue(columns[27]);
							ArrComuns[28] = objResult[fil].getValue(columns[28]);
							ArrComuns[29] = objResult[fil].getValue(columns[29]);
							ArrComuns[30] = objResult[fil].getValue(columns[30]);
							ArrComuns[31] = objResult[fil].getValue(columns[31]);
							ArrComuns[32] = objResult[fil].getValue(columns[32]);
							ArrComuns[33] = objResult[fil].getValue(columns[33]);
							ArrComuns[34] = objResult[fil].getValue(columns[34]);
							ArrComuns[35] = objResult[fil].getValue(columns[35]);
							ArrComuns[36] = objResult[fil].getValue(columns[36]);
							ArrComuns[37] = objResult[fil].getValue(columns[37]);
							ArrComuns[38] = objResult[fil].getValue(columns[38]);
							ArrComuns[39] = objResult[fil].getValue(columns[39]);
							ArrComuns[40] = objResult[fil].getValue(columns[40]);
							ArrComuns[41] = objResult[fil].getValue(columns[41]);
							ArrComuns[42] = objResult[fil].getValue(columns[42]);
							ArrComuns[43] = objResult[fil].getValue(columns[43]);
							ArrComuns[44] = objResult[fil].getValue(columns[44]);
							ArrComuns[45] = objResult[fil].getValue(columns[45]);
							ArrComuns[46] = objResult[fil].getValue(columns[46]);
							ArrComuns[47] = objResult[fil].getValue(columns[47]);

							// Carga arreglos de transacciones
							ArrTransaccion[pos] = ArrComuns;
							
							// Incrementa la fila
							pos++;
						}				
					} // Solo para Peru o Vacio
				}
				
				// Quiebre de 1000 en 1000
				intMinReg = intMaxReg; 
				intMaxReg += 1000;
				if (intLength<1000)
				{
					bolStop = true;
				}
			} else {
				bolStop = true;
			}
		}
		
		// Mensaje al Debug
		nlapiLogExecution('ERROR', 'ArrTransaccion - Filas Cargadas ', ArrTransaccion.length);

		// Verifica si hay informacion segun los criterios colocados
		if (ArrTransaccion.length==0){
		    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', paramrecolog);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', 'No existe informacion para los criterios seleccionados.');
			nlapiSubmitRecord(record, true);
			return true;
		}
			
		// Arma lineas del archivo
		var intLength = (ArrTransaccion.length - 1);
		for(var i = 0; i<=intLength; i++)
		{
			/* -----------------------------------
			 * Crea el archivo TXT
			 * ---------------------------------*/ 
			var typeTransAbrev = '';
			if (activeExpRep || activeExpRep=='T'){
				//Tiene activado el expense report
				typeTransAbrev = ArrTransaccion[i][0];
			}
			
			/*************************************************
			 * Verifica que sean iguales los Internal ID
			 * Columna 1 Internalid de la transaccion
			 * Columna 7 Numero de Serie
			 * Columna 9 Numero de Documento
			 ************************************************/

			 // El internal ID
			var auxid = ArrTransaccion[i][2];
			// Variables auxiliares 
			var auxTipod = ArrTransaccion[i][6];
			var auxSerie = ArrTransaccion[i][7];
			var auxNumer = ArrTransaccion[i][9];
			// Suma lineas para que salga una sola
			var fil = i;
			while ( auxid == ArrTransaccion[fil][2] && 
					( typeTransAbrev!='EXPREPT' || 
						(typeTransAbrev=='EXPREPT' && 
							auxTipod==ArrTransaccion[fil][6] && 
							auxSerie==ArrTransaccion[fil][7] && 
							auxNumer==ArrTransaccion[fil][9]) ) ) 
			{
				/***********************************
				 * Sumatoria de lineas
				 **********************************/
				
				// Base Imponible de las Adquisiones Gravadas en Op Gravadas
				var montoaux = ArrTransaccion[fil][14];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns14 += parseFloat(montoaux);
				// Monto del Impuesto General a las Ventas
				var montoaux = ArrTransaccion[fil][15];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns15 += parseFloat(montoaux);
				// Base imponible de las adquisiciones gravadas y no Gravadas
				var montoaux = ArrTransaccion[fil][16];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns16 += parseFloat(montoaux);
				// Monto del Impuesto General a las Ventas
				var montoaux = ArrTransaccion[fil][17];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns17 += parseFloat(montoaux);
				// Base imponible de las adquisiciones gravadas que no dan derecho a crÃ©dito fiscal
				var montoaux = ArrTransaccion[fil][18];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns18 += parseFloat(montoaux);
				// Monto del Impuesto General a las Ventas
				var montoaux = ArrTransaccion[fil][19];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns19 += parseFloat(montoaux);
				// Valor de las adquisiciones no gravadas
				var montoaux = ArrTransaccion[fil][20];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns20 += parseFloat(montoaux);
				//ISC
				var montoaux = ArrTransaccion[fil][21];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns21 += parseFloat(montoaux);
				// Otros tributos y Cargos
				var montoaux = ArrTransaccion[fil][22];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns22 += parseFloat(montoaux);
				//TOTAL
				columns23 += columns14 + columns15 + columns16 + 
							 columns17 + columns18 + columns19 + 
							 columns20 + columns21 + columns22;
				// Incremente en uno
				fil++;
				if (fil > intLength) {
					break;
				}
			}
			// Decrementa en uno
			i = fil-1;

			/****************************************************
			 * Comparacion de Fechas, para calcular el campo 41
			 ***************************************************/ 
			var Campo41 = '';
			var dFecTra = ArrTransaccion[i][42];	// Fecha Emision
			var dFecIni = ArrTransaccion[i][43];	// Periodo Inicial
			var dFecFin = ArrTransaccion[i][44];	// Periodo Final
			var dFecAnt = ArrTransaccion[i][45];	// 12 meses Anteriores al Periodo
			var dDocRec = ArrTransaccion[i][46];	// Es rectificacion
			
			/*******************************************************************************************************************
			 * 03 = Boleta de Venta
			 * 10 = Recibo por Arrendamiento
			 * 15 = Boleto emitido por las empresas de transporte publico urbano de pasajeros
			 * 16 = Boleto de viaje emitido por las empresas de transporte publico interprovincial de pasajeros dentro del pais
			 * 17 = Documento emitido por la Iglesia Catolica por el arrendamiento de bienes inmuebles
			 * *****************************************************************************************************************/ 	
			// Fecha Emision>=Periodo Inicial y  Fecha Emision<=Periodo Final
			if ((dFecTra >= dFecIni || dFecIni == '') && (dFecTra <= dFecFin || dFecFin =='') && dDocRec!='Si') {
				Campo41 = '1';
			}else{
				// Dentro de los 12 meses del Periodo Actual
				if (dFecTra >= dFecAnt && dFecTra <= dFecIni && dDocRec!='Si') {
					Campo41 = '6';
				}
				if (dFecTra < dFecAnt && dDocRec != 'Si') {
					Campo41 = '7';
				}
				if (dDocRec=='Si') {
					Campo41 = '9';
				}
			}
			//cambio 20/10/16				
			if(columns14+columns16==0 && columns18+columns20!=0){
				Campo41 = '0';
			}
			
			/* -----------------------------------
			 * Crea el archivo TXT
			 * ---------------------------------*/ 
			//VACIO LA LINEA PARA REALIZAR DESPUES LA DIVISION
			strName = '';
			// 1 Periodo
			strName += Periodo(ArrTransaccion[i][1]);	
			strName += "|";
			// 2 y 3 Numero correlativo del Registro o codigo unico de la operacion
			if(typeTransAbrev=='EXPREPT'){
				strName += ArrTransaccion[i][2]+ArrTransaccion[i][3];
				strName += "|";
				strName += "M"+ArrTransaccion[i][2]+ArrTransaccion[i][3];
				strName += "|";
			}else{
				strName += ArrTransaccion[i][2];
				strName += "|";
				strName += "M"+ArrTransaccion[i][2];
				strName += "|";
			}					
			// 4 Fecha de emision del comprobante de pago o documento
			strName += ArrTransaccion[i][4];			
			strName += "|";			
			/***************************************************
			 * 5 Fecha de Vencimiento o Fecha de Pago (1)
			 * Para el tipo de comprobante
			 * 14 = Recibo por servicios publicos de suministro 
			 * 		de energia electrica, agua, teléfono, 
			 * 	    télex y telegráficos y otros servicios 
			 * 		complementarios que se incluyan en el 
			 *      recibo de servicio público
			 **************************************************/ 			
			if (ArrTransaccion[i][6]=='14'){
				if (ArrTransaccion[i][5]=='' || ArrTransaccion[i][5]==null){
					strName += ArrTransaccion[i][4];
				}else{
					strName += ArrTransaccion[i][5];
				}
			}else{
				strName += '';
			}
			strName += "|";
			// 6 Tipo de Comprobante de Pago o Documento
			strName += ArrTransaccion[i][6];
			strName += "|";
			// 7 Serie del comprobante de pago o documento.
			var numeseri = ArrTransaccion[i][7];
				numeseri = numeseri.replace('|','');
				numeseri = numeseri.replace('-','');
				numeseri = numeseri.replace(' ','');
			if (ArrTransaccion[i][6]=='01' || ArrTransaccion[i][6]=='03' || ArrTransaccion[i][6]=='07' || ArrTransaccion[i][6]=='08'){
				strName += RellenaTexto(numeseri,4,'N');
			}else{
				/***************************************************
				 * Solo 1 digito para el siguiente tipo de documento:
				 * 05 = Boleto de compañia de aviacion comercial 
				 * 		por el servicio de transporte aereo de 
				 * 		pasajeros 
				 ***************************************************/
				if (ArrTransaccion[i][6]=='05'){
					strName += RellenaTexto(numeseri,1,'N');
				}else{
					/***************************************************
					 * Nro Formulario 1683 para el siguiente tipo de documento:
					 * 10 = Recibo por arrendamiento 
					 ***************************************************/
					if (ArrTransaccion[i][6]=='10'){
						strName += '1683';
					}else{
						/*************************************************** 
						 * Solo para el caso de tipo de documento DUA va 
						 * el codigo de la dependencia aduanera, esto va 
						 * por busqueda columna 29						 * 
						 * 50 = Declaracion unica de aduana - importacion definitiva
						 **************************************************/  
						if (ArrTransaccion[i][6]=='50'){
							strName += ArrTransaccion[i][29].substr(0,3);
						}else{
							/***************************************************
							 * Solo para los siguientes tipos de documentos la longitud
							 * debe ser de 6 digitos:
							 * 51 = Poliza o DUI fraccionada
							 * 52 =  
							 * 53 = Declaracion de mensajeria o courier
							 * 54 = 
							 ***************************************************/
							if (ArrTransaccion[i][6]>='51' && ArrTransaccion[i][6]<='54'){
								strName += RellenaTexto(numeseri,3,'N');
							}else{
								strName += numeseri;
							}
						}	// Fin Tipo de Documento 50
					}	// Fin Tipo de Documento 10
				}	// Fin Tipo de Documento 05
			}	// Fin columna 7
			strName += "|";
			// 8 Anio de emision de la DUA o DSI 
			strName += ArrTransaccion[i][8];	
			strName += "|";
			// 9 Numero del comprobante de pago o documento
			if (ArrTransaccion[i][6]=='01'){
				strName += RellenaTexto(ArrTransaccion[i][9], 7, 'N');
			}else{
				/***************************************************
				 * Solo para los siguientes tipos de documentos la longitud
				 * debe ser de 6 digitos:
				 * 50 = Declaracion unica de aduana - importacion definitiva 
				 * 51 = Poliza o DUI fraccionada
				 * 52 =  
				 * 53 = Declaracion de mensajeria o courier
				 * 54 = 
				 ***************************************************/
				if (ArrTransaccion[i][6]>='50' && ArrTransaccion[i][6]<='54'){
					strName += RellenaTexto(ArrTransaccion[i][9], 6, 'N');
				}else{
					strName += ArrTransaccion[i][9];
				}
			}			
			strName += "|";
			// 10 en caso de optar por imp tot de las operaciones diarias q no otorguen derecho a credito fiscal
			strName += ""
			strName += "|";
			// 11 Tipo de Documento de Identidad del proveedor
			strName += ArrTransaccion[i][11];	
			strName += "|";
			// 12 Numero de RUC del proveedor o numero de documento de Identidad, segun corresponda.
			strName += ArrTransaccion[i][12];	
			strName += "|";
			// 13 Apellidos y nombres, denominacion o razon social  del proveedor. En caso de personas naturales
			var denominacion = ArrTransaccion[i][13];
				denominacion = denominacion.replace('|',' ');
				denominacion = denominacion.replace('/',' ');
				denominacion = denominacion.replace(',',' ');
				denominacion = denominacion.replace('\r\n',' ');
				denominacion = denominacion.replace('\n\r',' ');
				denominacion = denominacion.replace('\n',' ');
			strName += denominacion;
			strName += "|";

			// Sumatoria de importes - Ultima modificacion && parseFloat(columns14)>0
			if( (typeTransAbrev=='BILLCRED' || ArrTransaccion[i][6]=='07') && 
				(parseFloat(columns14)>0 || parseFloat(columns15)>0 || parseFloat(columns16)>0 ||
				 parseFloat(columns17)>0 || parseFloat(columns18)>0 || parseFloat(columns19)>0 ||
				 parseFloat(columns20)>0 || parseFloat(columns21)>0 || parseFloat(columns22)>0) ){
				strName += (columns14*-1).toFixed(2);
				strName += "|";
				strName += (columns15*-1).toFixed(2);	
				strName += "|";
				strName += (columns16*-1).toFixed(2);
				strName += "|";
				strName += (columns17*-1).toFixed(2);
				strName += "|";
				strName += (columns18*-1).toFixed(2);
				strName += "|";
				strName += (columns19*-1).toFixed(2);
				strName += "|";
				strName += (columns20*-1).toFixed(2);
				strName += "|";
				strName += (columns21*-1).toFixed(2);
				strName += "|";
				strName += (columns22*-1).toFixed(2);
				strName += "|";
				strName += ((columns14*-1) + (columns15*-1) + (columns16*-1) + 
							(columns17*-1) + (columns18*-1) + (columns19*-1) + 
							(columns20*-1) + (columns21*-1) + (columns22*-1)).toFixed(2);
				strName += "|";
			}else{
				strName += columns14.toFixed(2);
				strName += "|";
				strName += columns15.toFixed(2);	
				strName += "|";
				strName += columns16.toFixed(2);
				strName += "|";
				strName += columns17.toFixed(2);
				strName += "|";
				strName += columns18.toFixed(2);
				strName += "|";
				strName += columns19.toFixed(2);
				strName += "|";
				strName += columns20.toFixed(2);
				strName += "|";
				strName += columns21.toFixed(2);
				strName += "|";
				strName += columns22.toFixed(2);
				strName += "|";
				strName += (columns14 + columns15 + columns16 + 
							columns17 + columns18 + columns19 + 
							columns20 + columns21 + columns22).toFixed(2);
				strName += "|";
			}
			// Codigo  de la Moneda
			strName += ArrTransaccion[i][24];	
			strName += "|";
			// Tipo de Cambio 9.999
			strName += parseFloat(ArrTransaccion[i][25]).toFixed(3);	
			strName += "|";
			// Fecha de emision del comprobante
			strName += ArrTransaccion[i][26];
			strName += "|";
			// 27 tipo de comprobante de pago que se modifica
			strName += ArrTransaccion[i][27];	
			strName += "|";
			// 28 Numero de serie del comprobante de pago que se modifica
			strName += RellenaTexto(ArrTransaccion[i][28],4,'N');	
			strName += "|";
			// 29 Codigo Dependencia Aduanera
			if (ArrTransaccion[i][27]=='50' || ArrTransaccion[i][27]=='52'){
				strName += RellenaTexto(ArrTransaccion[i][29],3,'C');	
			} else {
				strName += "   ";	
			}
			strName += "|";
			// 30 Numero del comprobante de pago que se modifica
			strName += ArrTransaccion[i][30];	
			strName += "|";
			// 31 Fecha de emision de la Constancia de Deposito de Detraccion
			strName += ArrTransaccion[i][31];	
			strName += "|";
			// 32 Numero de la Constancia de Deposito de Detraccion
			strName += ArrTransaccion[i][32];	
			strName += "|";
			// 33 Marca del comprobante de pago sujeto a retencion
			if (ArrTransaccion[i][33]=='0'){
				strName += "";	
			}else{
				strName += ArrTransaccion[i][33];	
			}
			strName += "|";
			// 34 Clasificacion de los bienes y servicios adquiridos
			strName += ArrTransaccion[i][34];
			strName += "|";
			// 35 Identificacion del Contrato o del proyecto en el caso de los Operadores de las sociedades 
			strName += ArrTransaccion[i][35];	
			strName += "|";
			// 36 Inconsistencia en el tipo de cambio
			strName += ArrTransaccion[i][36];	
			strName += "|";
			// 37 Inconsistencia por proveedores no habidos
			strName += ArrTransaccion[i][37];	
			strName += "|";
			// 38 Inconsistencia por proveedores 
			strName += ArrTransaccion[i][38];	
			strName += "|";
			// 39 Inconsistencia por DNIS
			strName += ArrTransaccion[i][39];	
			strName += "|";
			// 40 Indicador de Comprobantes de pago cancelados con medios de pago
			strName += ArrTransaccion[i][40];	
			strName += "|";

			// 41 Estado que identifica la oportunidad de la anotacion
			//strName += ArrTransaccion[i][41];	
			//strName += "|";
			strName += Campo41;
			strName += "|";
			
			// Fin de Linea
			strName += "\n";
			
			// inicializa variable
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

			// Parte los archivos
			if(i<20000){
				strName1 += strName;
			}
			if(i>=20000&&i<40000){
				strName2 += strName;
			}
			if(i>=40000){
				strName3 += strName;
			}
			strName = "";
		}
		
		// Insert cabecera
		if ( strName1!='' && strName1!=null && paraminshead=='T' ) {
			strName1 = cabecera + "\n" + strName1;
		}	
		if ( strName2!='' && strName2!=null && paraminshead=='T' ) {
			strName2 = cabecera + "\n" + strName2;
		}	
		if ( strName3!='' && strName3!=null && paraminshead=='T' ) {
			strName3 = cabecera + "\n" + strName3;
		}
		
		nlapiLogExecution('ERROR', 'Pasa a la siguiente funcion', 'savefile');
		
		// Crea y graba el archivo PDF
		savefile(paramsubsidi, paramrecolog, paraminshead);
	} catch(err) {
		// Actualiza el Log del reporte
	    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', paramrecolog);
			record.setFieldValue('custrecord_lmry_pe_2016_rg_name', 'Reporte cancelado.');
		nlapiSubmitRecord(record, true);
		
		// Envio de correo de error al usuario
		sendemail('scheduled_main - Error: ' + err, LMRY_script);
	}	
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
function savefile(paramsubsidi, paramrecolog, paraminshead){
	// Ruta de la carpeta contenedora
	var FolderId = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_pe_2016_rg_file_cabinet');
	var featuresubsFile = nlapiGetContext().getFeature('SUBSIDIARIES');
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
		}
		// Genera el nombre del archivo
		var NameFile  = Name_File(paramsubsidi);
			NameFile  = NameFile  + '(1)' + fileext;
		var NameFile2 = NameFile + '(2)' + fileext;
		var NameFile3 = NameFile + '(3)' + fileext;
		
		// Crea el archivo
		var File = nlapiCreateFile(NameFile, 'PLAINTEXT', strName1);	
			File.setFolder(FolderId);
		var idfile = nlapiSubmitFile(File);		// Termina de grabar el archivo
		var idfile2 = nlapiLoadFile(idfile);	// Trae URL de archivo generado

		// Archivo dos
		if(strName2!=''){
			var File2 = nlapiCreateFile(NameFile2, 'PLAINTEXT', strName2);	
				File2.setFolder(FolderId);
			var idfile = nlapiSubmitFile(File);		// Termina de grabar el archivo
			var idfile2 = nlapiLoadFile(idfile);	// Trae URL de archivo generado
		}

		// Archivo tres
		if(strName3!=''){
			var File3 = nlapiCreateFile(NameFile3, 'PLAINTEXT', strName3);	
				File3.setFolder(FolderId);
			var idfile = nlapiSubmitFile(File);		// Termina de grabar el archivo
			var idfile2 = nlapiLoadFile(idfile);	// Trae URL de archivo generado
		}
		
		// Obtenemo de las prefencias generales el URL de Netsuite (Produccion o Sandbox)
		var getURL = objContext.getSetting('SCRIPT', 'custscript_lmry_netsuite_location');
		var urlfile = '';
			if (getURL!='' && getURL!=''){
				urlfile += 'https://' + getURL;
			}
			urlfile += idfile2.getURL();
		
		//Genera registro personalizado como log
		if(idfile) {
			var usuario = objContext.getName();
			var subsidi = '';
			// Valida si es OneWorld 
			if (featuresubs == false){
				var company = nlapiLoadConfiguration('companyinformation'); 
				var	namecom = company.getFieldValue('legalname');
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
		    
		    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', paramrecolog);
				if (subsidi!='' && subsidi!=null){
					record.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
				}else{
					subsidi = record.getFieldValue('custrecord_lmry_pe_2016_rg_subsidiary');
				}
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
			nlapiSubmitRecord(record, true);

			// Archivo dos
			if(strName2!=''){
				var record2 = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile2);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'PE - Registro de Compras Electronico');
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile_2);
					record2.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
				nlapiSubmitRecord(record2, true);
				
				myfile = myfile + '\n\r' + NameFile2;
			}

			// Archivo tres
			if(strName3!=''){
				var record3 = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile3);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', 'PE - Registro de Compras Electronico');
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', subsidi);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile_3);
					record3.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
				nlapiSubmitRecord(record3, true);
				
				myfile = myfile + '\n\r' + NameFile3;
			}

			// Envia mail de conformidad al usuario
			sendrptuser('PE - Registro de Compras', 3, myfile);
		}
	} else {
		// Debug
		nlapiLogExecution('ERROR', 'Creacion de PDF', 'No se existe el folder');
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
	// AÃƒÂ±o y Mes
	var fileano = periodenddate.substr((periodenddate.length - 4), periodenddate.length)
	var filemes = Periodo(periodname, 1);
	
	/* ----------
	Nombre del Archivo - LERRRRRRRRRRRAAAAMM00080100000111.TXT
	01-02 = 'LE'
	03-13 = RRRRRRRRRRR = RUC
	14-17 = AAAA
	18-19 = MM
	20-21 = DD
	22-27 = LLLLLL = Identificador del libro
	28-29 = CC	   = Codigo de oportunidad de presentacion del EEFF, aplica al Libro de Inventarios y Balances, para los demÃƒÂ¡s consigne '00'
	30-30 = O	   = Indicador de operaciones
	31-31 = I	   = Indicador del contenido del libro o registro
	32-32 =	M	   = Indicador de la moneda utilizada
	33-33 = G	   = Indicador de libro electronico generado por el PLE
	---------- */
	NameFile = 'LE' + NroRuc + fileano + filemes + '00' + '080100' + '00' + '1' + '1' + '1' + '1' + '_' + NameTime;
	
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
// Concadena al aux un caracter segun la cantidad indicada
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
		if (Numero!='' && Numero!=null){
			TotalDigitos = parseFloat(TotalDigitos) * -1;
			Numero = (pd + Numero).slice(TotalDigitos);
		}
		return Numero;
	} else {
		Numero = Numero + pd;
		return Numero.substring(0, parseInt(TotalDigitos));
	}
}

//-------------------------------------------------------------------------------------------------------
// Replica un caracter segun la cantidad indicada
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