/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Ago 2014     LatamReady Consultor
 * File: LMRY_PE2016_ReporteLibroDiarioSCHDL.js
 */
var objContext =  nlapiGetContext();
// Nombre del Reporte
var namereport = "Registro de Libro Diario ";
var LMRY_script = 'LMRY PE 2016 Reportes Libro Diario SCHDL';

// Control de PDF
var strName = '';
var strName1 = '';
var strName2 = '';
var strName3 = '';
var strName4 = '';
var strCabecera = '';
var cantpagi = 0;
var configpage = '';
var companyruc = '';
var companyname = '';
var periodstartdate = '';
var periodenddate = '';
var periodname = '';
var auxmess = '';
var auxanio = '';
var auxdia = '';
var paramsubsidi = '';
var paramperiodo = '';
var paraminshead = '';
var paramIdInicio = '';
var paramTypeTransac = '';
var paramBusqueda = '';
var arrLibroDiario2016 = new Array();
var arrCuenta = new Array();
var ArrPlanCta3N = new Array();
var ArrPlanCta4N = new Array();
var ArrPlanCta5N = new Array();
var ArrPlanCtaM5N = new Array();
var paramPrefijo = '';

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled_main_LibroDiario_2016(type) {
	
	// Seteo de Porcentaje completo 
	objContext.setPercentComplete(0.00);
	
	// Parametros
	paramperiodo = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_periodo');
	paramsubsidi = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_subsidiaria');
	paraminshead = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_inshead');

	// Condicional para la busqueda
	paramBusqueda = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_search');
	// Internal ID Inicio
	paramIdInicio = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_begin_id');
    // Variable Prefijo
	paramPrefijo  = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_prefijo');
	
	nlapiLogExecution('error', 'paramperiodo, paramsubsidi, paraminshead, paramIdInicio,  paramPrefijo: ', 
					  paramperiodo + ' , ' + paramsubsidi + ' , ' + paraminshead + ', ' + paramIdInicio + ' , ' + paramPrefijo);
	
	if (paramIdInicio ==null)
		paramIdInicio = 0;
	
	var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
	if (featuresubs == true) {
		if (!ValidateCountry(paramsubsidi)) {
			return true;
		}	
	}
	
	// Datos de la empresa
	configpage = nlapiLoadConfiguration('companyinformation');
	companyruc = configpage.getFieldValue('employerid'); 
	companyname = configpage.getFieldValue('legalname');
	
	var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
	if (featuresubs == true) {
		companyname = ObtainNameSubsidiaria(paramsubsidi);	
		companyruc = ObtainFederalIdSubsidiaria(paramsubsidi);
	}
	companyruc = companyruc.replace(' ', '');
	
	ObtienePeriodo();
	ObtieneCuenta2016();
	ObtieneLibroDiario2016(); 
	nlapiLogExecution('ERROR', 'Termino: ','ObtieneLibroDiario2016()');
	
}
function ObtieneCuenta2016()
{
	var arrPlanAux = new Array();
	var columnasPlanContable = new Array();//declaramos columnas
		columnasPlanContable[0] = new nlobjSearchColumn('InternalId');
		columnasPlanContable[1] = new nlobjSearchColumn('Name');
		columnasPlanContable[2] = new nlobjSearchColumn('custrecord_lmry_cod_num');
	var _cont = 0;
	
	var searchresult = nlapiSearchRecord('customrecord_lmry_sunat_account_plan', null, null, columnasPlanContable);
	for(var i=0; i < searchresult.length; i++)
		{
		arrPlanAux = new Array();
		
		//0. INTERNAL ID
		if (searchresult[i].getText('InternalId')!=null)
			arrPlanAux[0] = searchresult[i].getText('InternalId') ;	
		else
			arrPlanAux[0] = '';
		//1. CODIGO NUMERO
		if (searchresult[i].getValue('custrecord_lmry_cod_num')!=null)
			arrPlanAux[1] = searchresult[i].getValue('custrecord_lmry_cod_num') ;	
		else
			arrPlanAux[1] = '';		
		//2. NAME 
		if (searchresult[i].getValue('name')!=null)
			arrPlanAux[2] = searchresult[i].getValue('name') ;	
		else
			arrPlanAux[2] = '';
		
		arrCuenta[_cont] = arrPlanAux;
		_cont++;
		
		}
}

function GenerarLibroDiario2016()
{
	var strCadAux = '';
	
	//Pinta Cabecera
	strCabecera = 'PERIODO | CODIGO UNICO DE LA OPE.|CORRELATIVO DEL ASIENTO CONTABLE|';
	strCabecera += 'CODIGO DE LA CUENTA DESAGREGADA|CODIGO DE LA UNIDAD DE OPERACION|CODIGO DEL CENTRO DE COSTOS|';
	strCabecera += 'TIPO DE MONEDA DE ORIGEN|TIPO DE DOCUMENTO DE IDENTIDAD DEL EMISOR|';
	strCabecera += 'NUMERO DE DOCUMENTO DE IDENTIDAD DEL EMISOR|';
	strCabecera += 'NUMERO DE SERIE DEL COMPROBANTE DE PAGO O DOCUMENTO ASOCIADA A LA OPERACION, DE CORRESPONDER|';
	strCabecera += 'NUMERO DEL COMPROBANTE DE PAGO O DOCUMENTO ASOCIADA A LA OPERACION|';
	strCabecera += 'FECHA CONTABL|FECHA DE VENCIMIENTO|FECHA DE LA OPERACION O EMISION|';
	strCabecera += 'FECHA DE LA OPERACION O EMISION|GLOSA O DESCRIPCION DE LA NATURALEZA DE LA OPERACION REGISTRADA, DE SER EL CASO|';
	strCabecera += 'GLOSA REFERENCIAL, DE SER EL CASO|MOVIMIENTOS DEL DEBE|MOVIMIENTOS DEL HABER|';
	strCabecera += 'DATO ESTRUCTURADO|INDICA EL ESTADO DE LA OPERACION';
	
	nlapiLogExecution('error', 'Generar Libro Diario 2016: ', arrLibroDiario2016.length-1);	

	for(var i=0; i<=arrLibroDiario2016.length-1; i++)
	{
		// 1 Periodo
		strCadAux += arrLibroDiario2016[i][1];
		strCadAux += "|";
		// 2 CUO
		strCadAux +=  arrLibroDiario2016[i][2];
		strCadAux += "|";
		// 3 M+CUO + Line ID
		if ((arrLibroDiario2016[i][2]!=null) && (arrLibroDiario2016[i][24]=='F'))
			strCadAux += RellenaTexto(("M" + arrLibroDiario2016[i][2] + arrLibroDiario2016[i][3]),10,'C');
		else
			strCadAux += RellenaTexto(("A" + arrLibroDiario2016[i][2] + arrLibroDiario2016[i][3]),10,'C');				
		strCadAux += "|";
		// 4 Codigo de la cuenta contable desagregado en subcuentas
		strCadAux += arrLibroDiario2016[i][4];	
		strCadAux += "|";
		// 5 Codigo de la Unidad de Operacion UEA
		strCadAux += "";			arrLibroDiario2016[i][5];	
		strCadAux += "|";
		// 6 Codigo del Centro de Costos
		var auxtmp = arrLibroDiario2016[i][6];
			auxtmp = auxtmp.replace(/ : /gi, ' ');
			auxtmp = auxtmp.replace('/', ' ');
		strCadAux += auxtmp;
		strCadAux += "|";
		// 7 Tipo de Moneda de origen
		strCadAux += arrLibroDiario2016[i][7];	
		strCadAux += "|";
		// 8 Tipo de Documento de identidad del emisor
		strCadAux += arrLibroDiario2016[i][8];	
		strCadAux += "|";
		// 9 Numero de Documento de identidad del emisor
		strCadAux += arrLibroDiario2016[i][9];	
		strCadAux += "|";
		// 10 Tipo de Comprobante de Pago o Doc. asociada a la Op. de corresponder
		strCadAux += arrLibroDiario2016[i][10];	
		strCadAux += "|";
		// 11 No de Serie del Comp. de pago o Doc asociada a la operacion, de corresponder
		strCadAux += RellenaTexto(arrLibroDiario2016[i][11],4,'N');	
		strCadAux += "|";
		// 12 No del comprobante de pago o Doc. asociada a la operacion
		strCadAux += arrLibroDiario2016[i][12];	
		strCadAux += "|";
		// 13 Fecha contable
		strCadAux += arrLibroDiario2016[i][13];	
		strCadAux += "|";
		// 14 Fecha de vencimiento
		strCadAux += arrLibroDiario2016[i][14];	
		strCadAux += "|";
		// 15 Fecha de la operacion o emision
		strCadAux +=  arrLibroDiario2016[i][15]; 
		strCadAux += "|";
		// 16 Glosa o descripcion de la naturaleza de la operacion registrada, de ser el caso.
		if ((arrLibroDiario2016[i][16]!=null) || (arrLibroDiario2016[i][16].length>0)){
			var auxtmp = arrLibroDiario2016[i][16];
				auxtmp = auxtmp.replace(':', ' ');
				auxtmp = auxtmp.replace('°', ' ');
				auxtmp = auxtmp.replace('/', ' ');
			strCadAux += RellenaTexto(auxtmp,100,'C');
		}
		strCadAux += "|";
		// 17 Glosa referencial, de ser el caso
		strCadAux +=  RellenaTexto(' ',100,'C');	
		strCadAux += "|";		
		// 18 Movimientos del Debe
		if  (arrLibroDiario2016[i][18]=='' || arrLibroDiario2016[i][18].length==0){
			strCadAux += "0.00"; 
		}else{
			strCadAux += parseFloat(arrLibroDiario2016[i][18]).toFixed(2);
		}
		strCadAux += "|";
		// 19 Movimientos del Haber
		if  (arrLibroDiario2016[i][19]=='' || arrLibroDiario2016[i][19].length==0){
			strCadAux += "0.00"; 
		}else{
			strCadAux += parseFloat(arrLibroDiario2016[i][19]).toFixed(2);
		}
		strCadAux += "|";
		// 20 DATO ESTRUCTURADO
		strCadAux += arrLibroDiario2016[i][20];
		strCadAux += "|";
		// 21 INDICA EL ESTADO DE LA OPERACION
		// Comparacion de Fechas
		strCadAux += arrLibroDiario2016[i][21];
		strCadAux += "|";
		// Salto de Linea
		strCadAux += "\r\n";
		
		// Quiebre - 15000 Lineas por archivo
		if (i>=0 && i<16000){
			strName1+=strCadAux;
			strCadAux='';
		}
		if (i>=16000 && i<32000){
			strName2+=strCadAux;
			strCadAux='';
		}
		if (i>=32000 && i<48000){
			strName3+=strCadAux;
			strCadAux='';
		}
		if (i>=48000){
			strName4+=strCadAux;
			strCadAux='';
		}
	}	
	
	// Debug
	nlapiLogExecution('ERROR', 'arrLibroDiario2016 - Rows', arrLibroDiario2016.length-1);

	// Parte el archivo
	if ((arrLibroDiario2016.length-1) > 0)
	{
		// Identificador del libro Diario
		var IdLibroDiario  = '050100';

		// Crea y graba el 1er archivo
		if (strName1!='' && strName1!=null){
			strName = strName1;
			savefile2016(IdLibroDiario, paraminshead, 1);
		}
		// Crea y graba el 2do archivo
		if (strName2!='' && strName2!=null){
			strName = strName2;
			savefile2016(IdLibroDiario, paraminshead, 2);
		}
		// Crea y graba el 3er archivo
		if (strName3!='' && strName3!=null){
			strName = strName3;
			savefile2016(IdLibroDiario, paraminshead, 3);
		}
		// Crea y graba el 4to archivo
		if (strName4!='' && strName4!=null){
			strName = strName4;
			savefile2016(IdLibroDiario, paraminshead, 4);
		}
	}else{
	    // Id de Log de generacion de reportes
		var recoid = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_log_id');
		if (recoid!='' && recoid!=null && recoid!=0){
		    var record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', recoid);
				record.setFieldValue('custrecord_lmry_pe_2016_rg_name', 'No existe informacion para los criterios seleccionados.');
			nlapiSubmitRecord(record, true);
		}
	}
}

/***********************************************
 * Carga la busqueda a un arreglo
 **********************************************/
function ObtieneLibroDiario2016()
{
	try
	{
		objContext.setPercentComplete(0.00);
		
		// Control de Memoria
		var intDMaxReg = 1000;
		var intDMinReg = 0;
		var arrAuxiliar = new Array();
		
		var DbolStop = false;
		
		// Valida si es OneWorld
		var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES');
	    var _cont = 0;
	    var auxCont = 0;

	    // Consulta del libro Mayor
	    nlapiLogExecution('error', 'transaction: ', paramBusqueda); 
		var savedsearch = nlapiLoadSearch('transaction', paramBusqueda);
			savedsearch.addFilter(new nlobjSearchFilter('postingperiod', null, 'anyof', paramperiodo));
			// Valida si es OneWorld 
			if (featuresubs == true) {
				savedsearch.addFilter(new nlobjSearchFilter('subsidiary', null, 'is', paramsubsidi));
			} 	
			if (paramIdInicio>0)
			   savedsearch.addFilter(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', paramIdInicio));
		// Ejecuta la busqueda
		var searchresult = savedsearch.runSearch();
		var auxid = 0;
		while (!DbolStop && objContext.getRemainingUsage() > 200)	{
			var objResult = searchresult.getResults(intDMinReg, intDMaxReg);
			
			if (objResult != null)
			{
				var intLength = objResult.length;
				nlapiLogExecution('error', 'intDMinReg, intDMaxReg: ', intDMinReg + ',' + intDMaxReg); 
				
				if  (intLength==0)
					{
					  DbolStop = true;
					  paramIdInicio = 0;
					}
				
				for(var i = 0; i < intLength; i++){
					// Cantidad de columnas de la busqueda
					columns = objResult[i].getAllColumns();
					
					/*********************************************
					 * Carga todoas las columnas de una 
					 * Fila en un arreglo
					 ********************************************/
					arrAuxiliar = new Array();
					for (var col = 0; col < columns.length; col++){
						/*********************************************
						 * Columna 6 Departamento
						 ********************************************/
						if (col==6) 
						{
							arrAuxiliar[col] = objResult[i].getText(columns[col]);
						}else{
							arrAuxiliar[col] = objResult[i].getValue(columns[col]);
						}
					}
					
					// validacion Internal ID
					if (auxid!=arrAuxiliar[2]) {
						auxid = arrAuxiliar[2];
					    auxCont =1;
				    } else {
						auxCont++;
				    }
					// Para el arreglo auxiliar a una matriz				
					arrLibroDiario2016[_cont] = arrAuxiliar;
					_cont++;
					
				 }
				 intDMinReg = intDMaxReg; 
				 intDMaxReg += 1000;
				
				if (arrAuxiliar[2]==null){
					DbolStop = true;
					paramIdInicio = 0;
					intDMaxReg = 0;
				}
				 
				 // Si no hubiera memoria  - Tope para partir el schedule
				 if ( objContext.getRemainingUsage() <= 200 )
				 {
					    nlapiLogExecution('error', 'auxCont, internalidnumber: ', auxCont + ' , ' + arrAuxiliar[2]); 
					 
					    // Filtros de la busqueda
					    var filters = new Array();
							filters[0] = new nlobjSearchFilter('memorized', null,  'is', 'F'); 
							filters[1] = new nlobjSearchFilter('posting', null,  'is', 'T'); 
							filters[2] = new nlobjSearchFilter('formulanumeric', null,  'greaterthan', 0);
							filters[2].setFormula('NVL({debitamount},0)+NVL({creditamount},0)');
							// Parametros dentro del script
							filters[3] = new nlobjSearchFilter('postingperiod', null,  'anyof', paramperiodo);
							filters[4] = new nlobjSearchFilter('internalidnumber', null,  'equalto', arrAuxiliar[2]); 
							// Solo si One World
							if (featuresubs == true)
							{
								 filters[5] = new nlobjSearchFilter('subsidiary', null,  'is',paramsubsidi);
							} 
						// Columnas de la busqueda
						var columns = new Array();
							columns[0] = new nlobjSearchColumn('internalid', null, 'group');
							columns[1] = new nlobjSearchColumn('linesequencenumber', null, 'count');
						var objResult = nlapiSearchRecord('transaction',null, filters, columns);
						
						// Resultados de la busqueda
						if ( objResult!=null && objResult!=''){
							// var nLength = objResult.length;
							columns = objResult[0].getAllColumns();
							var nLength =objResult[0].getValue(columns[1]);
							if  (parseFloat(nLength) > parseFloat(auxCont))	{
								var _valor = (parseFloat(nLength) - parseFloat(auxCont));
								if ( _valor >=1000)
									{ intDMaxReg = intDMinReg + 1000;  }
								else
									{ intDMaxReg = intDMinReg + (parseFloat(nLength) - parseFloat(auxCont));  }
							} else {
								paramIdInicio  = arrAuxiliar[2] ; 
								DbolStop = true;
							}
						}
						 
						// Inicio intLength
						nlapiLogExecution('error', 'intLength1: ', intLength);
						if (intLength<1000){ 
							var filters = new Array();
								filters[0] = new nlobjSearchFilter('internalidnumber', null,  'greaterthan', arrAuxiliar[2]);
								filters[1] = new nlobjSearchFilter('postingperiod', null,  'anyof',paramperiodo);
								if (featuresubs == true) 
									filters[2] = new nlobjSearchFilter('subsidiary', null,  'is',paramsubsidi);
							var auxResult = nlapiSearchRecord('transaction',paramBusqueda, filters, null);
							if (auxResult != null){
								if ( auxResult.length > 0 ) {
									paramIdInicio  = arrAuxiliar[2] ; 
									DbolStop = true;	 
								} else {
									DbolStop = true;
									paramIdInicio = 0;
								}
							} else {
								DbolStop = true;
								paramIdInicio = 0;	 
							}						  
						} //fin: if (intLength<1000)
					}
			}else{ 
				DbolStop = true;
			}
		}
		
		nlapiLogExecution('ERROR', 'paramIdInicio: ', paramIdInicio);
		if  (DbolStop == true)
			{ 
			if ( paramIdInicio!=0)
				{
					//Crear Libro Diario
					GenerarLibroDiario2016();

					//llama nuevamente al schedule
					var params = new Array();
						params['custscript_lmry_2016_ld_periodo'] = paramperiodo; 
						params['custscript_lmry_2016_ld_subsidiaria'] = paramsubsidi;	
						params['custscript_lmry_2016_ld_inshead'] = paraminshead;	
						params['custscript_lmry_2016_ld_begin_id'] = paramIdInicio; 
						params['custscript_lmry_2016_ld_search'] = paramBusqueda;
						params['custscript_lmry_2016_ld_prefijo'] = paramPrefijo;
					var status = nlapiScheduleScript(objContext.getScriptId(), objContext.getDeploymentId(),params);	
				}
			else
				{
					//Crear Libro Diario
					GenerarLibroDiario2016();
				}		  
			}
		
	}catch(error) {
		sendemail(' [ ObtieneLibroDiario2016 ] ' +error, LMRY_script);
	}
}

/***********************************************
 * Obtienes los datos de perido
 **********************************************/
function ObtienePeriodo()
{
	try
	{
		var periodstartdate  = '';
		if (paramperiodo!=null && paramperiodo!=''){
		    var columnFrom = nlapiLookupField('accountingperiod', paramperiodo, ['startdate','periodname','enddate']);
		    periodstartdate = columnFrom.startdate; 
		    periodname = columnFrom.periodname;
		    periodenddate =  columnFrom.enddate;
		    
		    auxdia = periodenddate.substring(0, 2);
		    
		   var x = Periodo(periodname);
		}
				
	}
	catch (error)
	{
		sendemail(' [ ObtienePeriodo ] ' +error, LMRY_script);
	}
}

/***********************************************
 * Valida que la sub sidiaria se Peru 
 **********************************************/
function ValidateCountry(subsidiari) {
	try{
		if (subsidiari != '' && subsidiari != null) {
			var country = nlapiLookupField('subsidiary', subsidiari, 'country');
			if (country == 'PE') {
				return true;
			}
		}
	}catch(err){
		sendemail(' [ ValidateCountry ] ' +err, LMRY_script);
	}
	return false;
}

/***********************************************
 * Graba el archivo en el Gabinete de Archivos
 * 
 * @param IdLibroDiario
 * @param paraminshead
 **********************************************/
function savefile2016(IdLibroDiario, paraminshead, number){
	try{
		// Ruta de la carpeta contenedora
		var FolderId = nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_pe_2016_rg_file_cabinet');
	    var TituloInforme = '';
	    
	    if (IdLibroDiario=='050100')
	    	{TituloInforme = 'Libro Diario Electrónico 2016'; }
	    else
	    	{TituloInforme = 'Libro Diario 2016- Detalle del Plan Contable utilizado electronico'; }
	    
		// Almacena en la carpeta de Archivos Generados
		if (FolderId!='' && FolderId!=null) {
			// Extension del archivo
			var fileext = '.txt';
			
			if ( paraminshead=='T' ) 
			{
				fileext = '.csv';
				strName = strCabecera + '\r\n' + strName;
				// Reemplaza la coma por blank space
				strName = strName.replace(/[,]/gi,' ');
				// Reemplaza la pipe por coma
				strName = strName.replace(/[|]/gi,',');
			}
			
		    // Id de Log de generacion de reportes
			var recoid = objContext.getSetting('SCRIPT', 'custscript_lmry_2016_ld_log_id');
			if (recoid=='' || recoid==null) { recoid=0; }

			// Nombre del archivo
			var NameFile = Name_File(IdLibroDiario) + number + fileext;
			if (number!=1){
				// Genera el nombre del archivo
				recoid =  0; 
			}
			
			// Crea el archivo
			var File = nlapiCreateFile(NameFile, 'PLAINTEXT', strName);	
				File.setFolder(FolderId);
		
			// Termina de grabar el archivo
			var idfile = nlapiSubmitFile(File);
		
			// Trae URL de archivo generado
			var idfile2 = nlapiLoadFile(idfile);
		
			var urlfile = '';
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
				var tmdate = new Date();
			    var myDate = nlapiDateToString(tmdate);
			    var myTime = nlapiDateToString(tmdate, 'timeofday');                
			    var current_date = myDate + ' ' + myTime;
			    var myfile = NameFile;
			    
			    // Dependiento del valor crea o actualiza el log 
			    var record = '';
				    if (recoid!=0){
					    record = nlapiLoadRecord('customrecord_lmry_pe_2016_rpt_genera_log', recoid);
				    }else{
					    record = nlapiCreateRecord('customrecord_lmry_pe_2016_rpt_genera_log');
				    }
					record.setFieldValue('custrecord_lmry_pe_2016_rg_name', NameFile);
					record.setFieldValue('custrecord_lmry_pe_2016_rg_transaction', TituloInforme );
					record.setFieldValue('custrecord_lmry_pe_2016_rg_postingperiod', periodname);
					record.setFieldValue('custrecord_lmry_pe_2016_rg_subsidiary', companyname);
					record.setFieldValue('custrecord_lmry_pe_2016_rg_url_file', urlfile);
					record.setFieldValue('custrecord_lmry_pe_2016_rg_employee', usuario);
				nlapiSubmitRecord(record, true);
				
				// Envia mail de conformidad al usuario
				sendrptuser('PE - Libro Diario', 3, myfile);
				
				// Mensaje en log debug
				nlapiLogExecution('ERROR', 'PE 2016 - Libro Diario', NameFile);
			}
		} else {
			// Debug
			nlapiLogExecution('ERROR', 'Creacion de PDF', 'No se existe el folder');
		}
	}catch(err){
		sendemail(' [ savefile2016 ] ' +err, LMRY_script);		
	}
}

/***********************************************
 * Obtiene el nomero de identificacion 
 * fiscal de la subsidiaria
 *  
 * @param subsidiari
 * @returns
 **********************************************/
function ObtainFederalIdSubsidiaria(subsidiari)
{
	try{
		if (subsidiari != '' && subsidiari != null) {
			var FederalIdNumber = nlapiLookupField('subsidiary', subsidiari, 'taxidnum');
			return FederalIdNumber;			 
		}
	}catch(err){
		sendemail(' [ ObtainFederalIdSubsidiaria ] ' +err, LMRY_script);
	}
	return '';
}

/***********************************************
 * Nombre del Archivo a generar
 * 
 * @param IdLibroDiario
 * @returns {String}
 **********************************************/	
function Name_File(IdLibroDiario) {
	var GMTtime = calcTime('-6');
	var DateHH = GMTtime.getHours();
	var DateMM = GMTtime.getMinutes();
	var DateSS = GMTtime.getSeconds();
	// Hora de generacion 
	var NameTime = DateHH.toString()+DateMM.toString()+DateSS.toString();
	
	// Anio del periodo consultado  
	var DateYY = auxanio;	
	//Mes del periodo consultado 
	var DateMM = auxmess ; 
	// Aplica al Libro de Inventarios y Balances, para los demos consigne '00'
	var DateDD = '00';
	// Codigo de oportunidad de presentacion del EEFF, aplica al Libro de Inventarios y Balances, para los demos consigne '00'
	var CodOportunidad = '00';
	// Indicador de operaciones
	var IdOperacion='1';
	// Indicador del contenido del libro o registro
	var IdContenido ='1';
	// Indicador de la moneda utilizada: 1=Nuevos Soles, 2 = Dolares
	var IdMoneda = '1';
	// Indicador de libro electronico generado por el PLE
	var IdLibroElectronico ='1';
    
	var NameFile = 'LE' + companyruc + DateYY + DateMM + DateDD;
		NameFile = NameFile + IdLibroDiario + CodOportunidad + IdOperacion;
		NameFile = NameFile + IdContenido + IdMoneda + IdLibroElectronico;
		NameFile = NameFile + "_" + paramPrefijo + "_" + NameTime;
	 
	// Return File Name as a string
	return NameFile;
}

/***********************************************
 * Formato de la fecha
 * 
 * @param offset
 * @returns
 **********************************************/
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

/***********************************************
 * Del Period obtien la Fecha de proceso
 * 
 * @param periodo
 * @returns {String}
 **********************************************/
function Periodo(periodo) {
	var auxfech = '';
	
	
	auxanio= periodo.substring(4);
	switch (periodo.substring(0, 3).toLowerCase()) {
	  case 'ene':
		  auxmess = '01';
		  break;
	  case 'jan':
		  auxmess = '01';
		  break;
	  case 'feb':
		  auxmess = '02';
		  break;
	  case 'mar':
		  auxmess = '03';
		  break;
	  case 'abr':
		  auxmess = '04';
		  break;
	  case 'apr':
		  auxmess = '04';
		  break;		 
	  case 'may':
		  auxmess = '05';
		  break;
	  case 'jun':
		  auxmess = '06';
		  break;
	  case 'jul':
		  auxmess = '07';
		  break;
	  case 'ago':
		  auxmess = '08';
		  break;
	  case 'aug':
		  auxmess = '08';
		  break;		  
	  case 'set':
		  auxmess = '09';
		  break;
	  case 'sep':
		  auxmess = '09';
		  break;	  
	  case 'oct':
		  auxmess = '10';
		  break;
	  case 'nov':
		  auxmess = '11';
		  break;
	  case 'dic':
		  auxmess = '12';
		  break;
	  case 'dec':
		  auxmess = '12';
		  break;
	  default:
		  auxmess = '00';
		  break;
	}
	auxfech = auxanio + auxmess + '00';
	return auxfech;
}

/***********************************************
 * Concadena al aux un caracter segun la 
 * cantidad indicada.
 * 
 * @param aux
 * @param TotalDigitos
 * @param TipoCaracter
 * @returns
 **********************************************/
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

/***********************************************
 * Replica un caracter segun la cantidad indicada
 * 
 * @param cantidad
 * @param carac
 * @returns {String}
 **********************************************/
function repitechar(cantidad, carac) {
	var caracter = carac;
	var numero = parseInt(cantidad);
	var cadena = '';
	for ( var r = 0; r < numero; r++) {
		cadena += caracter;
	}
	return cadena;
}

/***********************************************
 * Se obtiene el Nombre Legal del la Subsidiaria
 * 
 * @param subsidiari
 * @returns
 **********************************************/
function ObtainNameSubsidiaria(subsidiari)
{
	try{
		if (subsidiari != '' && subsidiari != null) {
			var Name = nlapiLookupField('subsidiary', subsidiari, 'legalname');
			return Name;			 
		}
	}catch(err){
		sendemail(' [ ObtainNameSubsidiaria ] ' +err, LMRY_script);
	}
	return '';
}

/***********************************************
 * Se obtiene el Numero DOI del la Subsidiaria
 * 
 * @param subsidiari
 * @returns
 ***********************************************/
function ObtainFederalIdSubsidiaria(subsidiari)
{
	try{
		if (subsidiari != '' && subsidiari != null) {
			var FederalIdNumber = nlapiLookupField('subsidiary', subsidiari, 'taxidnum');
			return FederalIdNumber;			 
		}
	}catch(err){
		sendemail(' [ ObtainFederalIdSubsidiaria ] ' +err, LMRY_script);
	}
	return '';
}
