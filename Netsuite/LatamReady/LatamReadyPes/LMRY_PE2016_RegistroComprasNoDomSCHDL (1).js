/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 feb 2016    LatamReady Consultor
 * File: LMRY_PE2016_RegistroComprasNoDomSCHDL.js
 */
var objContext =  nlapiGetContext();
var LMRY_script = 'LMRY PE 2016 Registro Compras No Domiciliado SCHDL';
// Nombre del Reporte
var namereport = "PE 2016 - Registro de Compras No Domiciliado ";
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
var companyruc = '';
var companyname = '';
var periodstartdate = '';
var periodenddate = '';
var periodname = '';
var activeExpRep = null;
var ArrTransaccion = new Array();
var featuresubs = '';
var cabecera = 'PERIODO|CORRELATIVO1|CORRELATIVO2|FECHA DE EMISION DEL COMP DE PAGO O DOC|TIPO DE COMP DE PAGO O DOC NO DOMICILIADO|SERIE DEL COMP PAGO O DOC|N° COMP PAGO O DOC|' +
				'VALOR DE LAS AQUISICIONES|OTROS CONCEPTOS TRIB Y CARGO QUE NO FORMEN PARTE DE LA BASE IMP|IMPORTE TOTAL DE LAS ADQ REGISTRADAS SEGUN COMP PAGO|' +
				'TIPO DE COMP PAGO O DOC QUE SUSTENTA EL CRED FISCAL|SERIE DEL COMP PAGO O DOC (DUA)(DSI)|AÑO EMISION DE LA (DUA) O (DSI)|N° ORDEN DEL FORMULARIO FISICO O VIRTUAL DEL NO DOM|' +
				'MONTO DE RETENCION DEL IGV|CODIGO DE LA MONEDA|TIPO DE CAMBIO|PAIS DE LA RESIDENCIA NO DOM|APE Y NOM O RAZON SOCIAL NO DOM|'+
				'DOMICILIO EN EL EXTRANJERO NO DOM|N°IDENTIFICACION NO DOM|N° IDENTIFICACION FISCAL DEL BENEFICIARIO|AP Y NOM, DENOMINACION O RAZON SOCIAL DEL PROVEEDOR|' +
				'PAIS DE RESIDENCIA DEL BENEFICIARIO EFECTIVO DE LOS PAGOS|VINCULO CONTRIB Y RES EXTRANJERO|RENTA BRUTA|DEDUCCION COSTO DE ENAJENACION DE BIENES DE CAPITAL|RENTA NETA|' +
				'TASA DE RETENSION|IMPUESTO RETENIDO|CONVENIOS PARA EVITAR LA DOBLE IMPOSICION|EXONERACION APLICADA|TIPO DE RENTA|MODALIDAD DEL SERV PRESTADO POR NO DOMICILIADO|' +
				'APLICACION DEL PENULTIMO PARRAFO ART 76° LEY DEL IMPUESTO A LA RENTA|ESTADO QUE IDENTIFICA LA OPORTUNIDAD DE LA ANOTACION\n';
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
var	paramMultibook	=	null;	


//Valida si es OneWorld
var featuresubs	 =	objContext.getFeature('SUBSIDIARIES');
var feamultibook =	objContext.getFeature('MULTIBOOK');


function scheduled_main_no_domiciliado() {
	// Seteo de Porcentaje completo 
	//return true;
	objContext.setPercentComplete(0.00);
	
	// Valida si es OneWorld
	featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');

	// Valida si tiene activo modulo Expense Reports
	activeExpRep = 'T';//objContext.getSetting('SCRIPT', 'custscript_expense_reports_activado');
	
	// Parametros
	var paramperiodo = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_nd_2016_periodo');
	var paramrecolog = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_nd_2016_interna');
	var paramsubsidi = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_nd_2016_subsidi');
	var paraminshead = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_nd_2016_inshead');
	paramMultibook	=	objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_nd_2016_multibooki');
	
	nlapiLogExecution('ERROR', 'Periodo, Internalid, Subsidiaria, paraminshead: ', paramperiodo + ', ' + paramrecolog + ', ' + paramsubsidi + ', ' + paraminshead);
	
	if (!ValidateCountry(paramsubsidi)) {
		return true;
	}
	// Datos de la empresa

	var Record = CompanyData(paramsubsidi);
	companyruc  = Record[0];
	companyname = Record[1];

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
		var columns08 = 0.00;
		var columns09 = 0.00;
		var columns10 = 0.00;
		var columns26 = 0.00;
		var columns27 = 0.00;
		var columns28 = 0.00;
		var coltaxcod = '0';
		
		var auxid = 0;
		var columns = new Array(); 
		
		// Transaccion :  LatamReady - PE 2016 Registro de Compras No Domiciliado
		var savedsearch = nlapiLoadSearch('transaction', 'customsearch_lmry_pe2016_reg_comp_nodomi');	
		//var savedsearch = nlapiLoadSearch('transaction', 'customsearch_lmry_pe2016_reg_comp_nodo_2');
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
			nlapiLogExecution('ERROR', 'CALCULANDO RANGO', intMinReg + ' - ' + intMaxReg);
			
			var objResult = searchresult.getResults(intMinReg, intMaxReg);
			
			nlapiLogExecution('ERROR', 'YA PASO LINEA 1', intMinReg + ' - ' + intMaxReg);
			
			if (objResult!=null && objResult!='')
			{
				// Filas
				intLength = objResult.length
				nlapiLogExecution('ERROR', 'CANTIDAD DE LINEAS', intLength);
				for (var fil = 0; fil < intLength; fil++)
				{
					intTotalRows++;

					// Columnas
					var ArrComuns = new Array();
					columns = objResult[fil].getAllColumns();
					for (var col = 0; col < columns.length; col++)
					{
						/*********************************************
						 * Columna 1 Periodo
						 ********************************************/
						if (col==1) 
						{
							ArrComuns[col] = objResult[fil].getText(columns[col]);
						} else {
							ArrComuns[col] = objResult[fil].getValue(columns[col]);
						}
					}
					// Carga arreglos de transacciones
					ArrTransaccion[pos] = ArrComuns;
					// Incrementa la fila
					pos++;
				}
				
				nlapiLogExecution('ERROR', 'FILAS CARGADAS', pos);
				
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
		nlapiLogExecution('ERROR', 'ArrTransaccion', ArrTransaccion.length);

		// Arma lineas del archivo
		var intLength = (ArrTransaccion.length - 1);
		for(var i = 0; i<=intLength; i++)
		{
			// Internal ID
			var internalid = ArrTransaccion[i][2];
			/* -----------------------------------
			 * Crea el archivo TXT
			 * ---------------------------------*/ 
			var typeTransAbrev = '';
			if (activeExpRep || activeExpRep=='T'){
				//Tiene activado el expense report
				typeTransAbrev = ArrTransaccion[i][0];
			}
			// Validando el numero segun el tipo de documento fiscal (Columna 6)
			if(ArrTransaccion[i][6]=='01'){
				var auxNumero = (('0000000')+ArrTransaccion[i][9]).slice(-7);
				auxNumero = auxNumero.substring(0, 7);
			}else{
				var auxNumero = ArrTransaccion[i][6];
			}

			/*************************************************
			 * Verifica que sean iguales los Internal ID
			 * Columna 1 Internalid de la transaccion
			 ************************************************/
			 // El internal ID
			var auxid = ArrTransaccion[i][2];
			
			/*******************************************
			 * Suma lineas de una misma transaccion
			 * para que salga una sola linea
			 ******************************************/ 
			var fil = i;			
			while ( auxid == ArrTransaccion[fil][2] ) 
			{
				// 8 Valor de las Adquisiciones
				var montoaux = ArrTransaccion[fil][8];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns08 += parseFloat(montoaux);
				// 9 Otros conceptos, tributos y cargos que no formen parte de la Base imponible.
				var montoaux = ArrTransaccion[fil][9];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns09 += parseFloat(montoaux);
				// 10 Importe total de las adquisiciones registradas según comprobante de pago.
				var montoaux = ArrTransaccion[fil][10];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				columns10 += parseFloat(montoaux);
				// Monto del Impuesto General a las Ventas
				var montoaux = ArrTransaccion[fil][26];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				// Tipo de Cuenta
				var typeacc = ArrTransaccion[fil][42];
					typeacc = typeacc.toUpperCase();
				// Solo para la columna de importes 26 al 28
				/* Solo en el caso de que la base imponible este negativo 
					ingresa a este criterio - OTHER CURRENT ASSET			*/
/*
	// 2017/03/20 - Comentado por error en reporte en Adistec
				if (  (typeacc=='OTHER CURRENT LIABILITY' || typeacc=='OTROS PASIVOS CIRCULANTES') 
					   && montoaux<0){
					nlapiLogExecution('ERROR', 'entro', 'entro');
						montoaux=parseFloat(montoaux)*-1;
				}
*/
				columns26 += parseFloat(montoaux);
				// Base imponible de las adquisiciones gravadas que no dan derecho a crÃ©dito fiscal
				var montoaux = ArrTransaccion[fil][27];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				// Tipo de Cuenta
				var typeacc = ArrTransaccion[fil][42];
					typeacc = typeacc.toUpperCase();
				// Solo para la columna de importes 26 al 28
				/* Solo en el caso de que la base imponible este negativo 
					ingresa a este criterio - OTHER CURRENT ASSET			*/
				if (  (typeacc=='OTHER CURRENT LIABILITY' || typeacc=='OTROS PASIVOS CIRCULANTES') 
					   && montoaux<0){
					nlapiLogExecution('ERROR', 'entro', 'entro');
						montoaux=parseFloat(montoaux)*-1;
				}
				columns27 += parseFloat(montoaux);
				// Monto del Impuesto General a las Ventas
				var montoaux = ArrTransaccion[fil][28];
				if (montoaux=='' || montoaux==null) { montoaux = 0; }
				// Tipo de Cuenta
				var typeacc = ArrTransaccion[fil][42];
					typeacc = typeacc.toUpperCase();
				// Solo para la columna de importes 26 al 28
				/* Solo en el caso de que la base imponible este negativo 
					ingresa a este criterio - OTHER CURRENT ASSET			*/
/*
	// 2017/03/20 - Comentado por error en reporte en Adistec
				if (  (typeacc=='OTHER CURRENT LIABILITY' || typeacc=='OTROS PASIVOS CIRCULANTES') 
					   && montoaux<0){
					nlapiLogExecution('ERROR', 'entro', 'entro');
						montoaux=parseFloat(montoaux)*-1;
				}
*/
				columns28 += parseFloat(montoaux);
				// Incremente en uno
				fil++;
				if (fil > intLength) {
					break;
				}

			} // **** Fin de Sumatoria de Lineas ****
			
			// Decrementa en uno
			i = fil-1;
			/* -----------------------------------
			 * Crea el archivo TXT
			 * ---------------------------------*/ 
			//VACIO LA LINEA PARA REALIZAR DESPUES LA DIVISION
			strName = '';
			// 1 Periodo
			strName += Periodo(ArrTransaccion[i][1]);	
			strName += "|";
			// 2 y 3 Numero correlativo del Registro o codigo unico de la operacion
			//strName += ArrTransaccion[i][2]+ArrTransaccion[i][3];
			strName += ArrTransaccion[i][2];
			strName += "|";
			//strName += "M"+ArrTransaccion[i][2]+ArrTransaccion[i][3];
			strName += "M"+ArrTransaccion[i][2];
			strName += "|";
			// 4 Fecha de emision del comprobante de pago o documento
			strName += ArrTransaccion[i][4];			
			strName += "|";			
			
			// En la columna 5 esta el tipo de comprobante 
			var tipoComprobanteAux = '';
				tipoComprobanteAux = ArrTransaccion[i][5];
			// 5 Tipo de Comp de Pago o Doc no Domiciliado
			strName += tipoComprobanteAux;
			strName += "|";
			// 6 Serie del Comp  pago o Doc 
			if(typeTransAbrev=='EXPREPT'){
				// Validando el tipo de documento en Expense Reporte
				if(ArrTransaccion[i][6]=='01' || ArrTransaccion[i][6]=='03' || ArrTransaccion[i][6]=='07'){
					strName += (('0000')+ArrTransaccion[i][6]).slice(-4);
				}else{
					strName += ArrTransaccion[i][6];
				}
			}else{
				// Validando el tipo de documento en Bill
				if(ArrTransaccion[i][6]=='01' || ArrTransaccion[i][6]=='07'){
					strName += (('0000')+ArrTransaccion[i][6]).slice(-4);
				}else{
					strName += ArrTransaccion[i][6];
				}
			}
			strName += "|";
			// 7 Valor de las Adquisiciones
			strName += ArrTransaccion[i][7];
			strName += "|";

			// 8 Valor de las Adquisiciones
			strName += columns08.toFixed(2);
			strName += "|";
			// 9 Otros conceptos, tributos y cargos que no formen parte de la Base imponible.
			strName += columns09.toFixed(2);
			strName += "|";
			// 10 Importe total de las Adquisiciones Registradas segun Comp de pago.
			strName += columns10.toFixed(2);
			strName += "|";
			// 11 Tipo de Comp de Pago o Doc que sustenta el crÃ©dito fiscal
			strName += ArrTransaccion[i][11];	
			strName += "|";
			// 12 12 Serie del Comp de pago o Doc (DUA)(DSI)
			strName += ArrTransaccion[i][12];	
			strName += "|";
			// 13 AÃ±o de emision de la DUA o DSI 
			strName += ArrTransaccion[i][13];
			strName += "|";

			nlapiLogExecution('ERROR', 'ArrTransaccion[i][24]', ArrTransaccion[i][24]);

			// *************** Sumatoria de importes
			// 14 Nro de Orden del Formulario Fisico o Virtual del no Domiciliados (DUA) (DSI)
			strName += ArrTransaccion[i][14];
			strName += "|";
			// 15 Monto de Retencion del IGV (debe salir vacío si el campo es igual a 0.00 caso contrario el monto del campo)
			if (ArrTransaccion[i][15]=='0.00' || ArrTransaccion[i][15]=='.00' || ArrTransaccion[i][15]=='0'){
				strName += '';
			}else{
				strName += ArrTransaccion[i][15];
			}
			strName += "|";
			// 16 Codigo  de la Moneda
			strName += ArrTransaccion[i][16];	
			strName += "|";
			// 17 Tipo de cambio
			strName += ArrTransaccion[i][17];	
			strName += "|";
			// 18 Pais de la Residencia del no Domiciliado
			strName += ArrTransaccion[i][18];	
			strName += "|";
			// 19 Apellidos y nombres o Razon Social del no Domiciliado
			strName += ArrTransaccion[i][19];	
			strName += "|";
			// 20 Domicilio en el Extranjero del No Domiciliado
			strName += ArrTransaccion[i][20];
			strName += "|";
			// 21 Numero de identificacion del  No Domiciliado
			strName += ArrTransaccion[i][21];//companyruc;	
			strName += "|";
			// 22 Nro de Identificacion Fiscal del Beneficiario efectivo de los Pagos
			strName += ArrTransaccion[i][22];//companyname;	
			strName += "|";
			// 23 Ap y Nom, Denominacion o Razon Social del Proveedor
			strName += ArrTransaccion[i][23];	
			strName += "|";
			// 24 Pais de la Residencia del Beneficiario efectivo de los Pagos
			strName += ArrTransaccion[i][24];	
			strName += "|";
			// 25 Vinculo Contrib. y Res. Extranj.
			var vinculoAux	=	ArrTransaccion[i][25];	
			if(vinculoAux==''||vinculoAux=='ERROR: no se encuentra el campo.'){
				strName += '00';	
			}else{
				strName += ArrTransaccion[i][25];	
			}
			strName += "|";
			// 26 Renta Bruta
			// Verifica que el tipo de documento es igual a 97 (Nota de Credito No Domiciliado)
			if (ArrTransaccion[i][5]=='97'){
				strName += Math.abs(columns26.toFixed(2)) * -1;
			}else{
				strName += Math.abs(columns26.toFixed(2));
			}
			strName += "|";
			//27 Deduccion/Costo de Enajenacion de Bienes de Capital
			strName += columns27.toFixed(2);
			strName += "|";
			// 28 Renta Neta
			// Verifica que el tipo de documento es igual a 97 (Nota de Credito No Domiciliado)
			if (ArrTransaccion[i][5]=='97'){
				strName += Math.abs(columns28.toFixed(2)) * -1;
			}else{
				strName += Math.abs(columns28.toFixed(2));
			}
			strName += "|";
			// 29 Tasa de Retencion (debe salir vacío si el campo es igual a 0.00 caso contrario el monto del campo)
			if (ArrTransaccion[i][29]=='0.00' || ArrTransaccion[i][29]=='0.0%' || ArrTransaccion[i][29]=='0'){
				strName += '';
			}else{
              nlapiLogExecution('ERROR','TEST',ArrTransaccion[i][29]);
				strName += parseFloat(ArrTransaccion[i][29]).toFixed(2);
			}			
			strName += "|";
			// 30 Impuesto Retenido  (debe salir vacío si el campo es igual a 0.00 caso contrario el monto del campo)
			if (ArrTransaccion[i][30]=='0.00' || ArrTransaccion[i][30]=='.00' || ArrTransaccion[i][30]=='0'){
				strName += '';
			}else{
				strName += ArrTransaccion[i][30];	
			}			
			strName += "|";
			// 31 Convenios para evitar la doble Imposicion
			strName += ArrTransaccion[i][31];	
			strName += "|";
			// 32 Exoneracion Aplicada
			if (ArrTransaccion[i][32]=='' || ArrTransaccion[i][32]==null)
			{
				// En caso de vacio o nulo no se envia nada
				strName += ""; 
			}else{
				strName += ArrTransaccion[i][32];
			}
			strName += "|";
			// 33 Tipo de Renta
			strName += ArrTransaccion[i][33];	
			strName += "|";
			// 34 Modalidad del Serv Prestado por el No Domiciliado
			strName += ArrTransaccion[i][34];	
			strName += "|";
			// 35 Aplicacion del penultimo parrafo del Art. 76Â° de la Ley del Impuesto a la Renta
			strName += "";		//ArrTransaccion[i][35];
			strName += "|";
			// 36 Estado que Identifica la Oportunidad de la Anotacion o Indicacion 
			//strName += ArrTransaccion[i][36];	
			//strName += "|";
			// Comparacion de Fechas
			var dFecTra = ArrTransaccion[i][37];	// Fecha Emision
			var dFecIni = ArrTransaccion[i][38];	// Periodo Inicial
			var dFecFin = ArrTransaccion[i][39];	// Periodo Final
			var dFecAnt = ArrTransaccion[i][40];	// 12 meses Anteriores al Periodo
			var dDocRec = ArrTransaccion[i][41];	// Es rectificacion
			if(tipoComprobanteAux=='91' || tipoComprobanteAux=='97' || tipoComprobanteAux=='98')
			{
				strName += '0';
			}else{
				strName += "1";
			}
										
			strName += "|";
			
			// Fin de Linea
			strName += "\n";
			
			// inicializa variable
			columns08 = 0.00;
			columns09 = 0.00;
			columns10 = 0.00;
			columns26 = 0.00;
			columns27 = 0.00;
			columns28 = 0.00;

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
	} catch(err) {
		sendemail('nlapiLoadSearch - Error: ' + err, LMRY_script);
		return true;
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
		var NameFile = Name_File(paramsubsidi) + fileext;
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
			var subsidi = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_rc_2016_subsidi');
			// Valida si es OneWorld 
			if (featuresubs == false){
				var company = nlapiLoadConfiguration('companyinformation'); 
				var	namecom = company.getFieldValue('companyname');
					company = null;
				subsidi = namecom;
			}else{
				if (subsidi!=null && subsidi!='') {
					subsidi = nlapiLookupField('subsidiary', subsidi, 'legalname');
				}
			}
			var tmdate = new Date();
			var myDate = nlapiDateToString(tmdate);
			var myTime = nlapiDateToString(tmdate, 'timeofday');                
			var current_date = myDate + ' ' + myTime;
			var myfile = NameFile;
			
			var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', paramrecolog);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile);
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
// Datos de la empresa 
//-------------------------------------------------------------------------------------------------------
function CompanyData(subsidiari) {
var data = new Array();
	data[0] = '';
	data[1] = '';
	try{
		var featuresubs = objContext.getFeature('SUBSIDIARIES');
		if (featuresubs == true) {
			var Record = nlapiLookupField('subsidiary', subsidiari, ['legalname','taxidnum']);
			data[0] = Record.legalname;
			data[1] = Record.taxidnum;
		} else{
			var configpage = nlapiLoadConfiguration('companyinformation');
			data[0] = configpage.getFieldValue('legalname');
			data[1] = configpage.getFieldValue('employerid'); 
			configpage = null;
		}
	}catch(err){
		sendemail(' [ ObtainNameSubsidiaria ] ' +err, LMRY_script);
	}
	return data;	
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
	Nombre del Archivo - LERRRRRRRRRRRAAAAMM0014010000OIM1.TXT
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
	if (intTotalRows==0){
		NameFile = 'LE' + NroRuc + fileano + filemes + '00' + '080200' + '00' + '1' + '0' + '1' + '1' + '_' + NameTime;
	}else{
		NameFile = 'LE' + NroRuc + fileano + filemes + '00' + '080200' + '00' + '1' + '1' + '1' + '1' + '_' + NameTime;
	}
	
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
		Numero = pd.substring(0, mon_len) + Numero;
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