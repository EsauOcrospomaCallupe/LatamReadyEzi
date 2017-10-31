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
var FORMULARIO='';
var ITEM='';
var LOCATION='';
var CLIENTE='';
var DEPA='';
var intMaxReg = 1000;
var intMinReg = 0;
var bolStop = false;
var LOGRECORD_ID= 'customrecord_lmry_pe_bol_mas_log';
var id_BMlog='';

// Empieza el proceso del Schedule
function BM_main_schedule()
{
	try {	
		getEnableFeatures();
		var param_periodo     = objContext.getSetting('SCRIPT', 'custscript_lmry_pe_bol_periodo');
		var periodoname = nlapiLookupField('accountingperiod', param_periodo, 'periodname');
	 	var objResultSearch = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo','customsearch_lmry_pe_ei_boleteo_masivo');
       objResultSearch.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_period', null, 'anyof', param_periodo));
      var busquedaResult	= objResultSearch.runSearch();
      var objResult = busquedaResult.getResults(0, 50);
      
			if (objResult!=null && objResult!='') {
                var intLength = objResult.length;
				for (var fil = 0; fil < intLength; fil++){
                    var columnsDetalle	=	objResult[fil].getAllColumns();
					var serie      =  objResult[fil].getText(columnsDetalle[0]);
					var serieid    =  objResult[fil].getValue(columnsDetalle[0])
					var preimpresoini =  objResult[fil].getValue(columnsDetalle[1]);
					var subsi 	   =  objResult[fil].getValue(columnsDetalle[2]);
					
					var fecha 	   =  objResult[fil].getValue(columnsDetalle[3]);
					var codigoid   =  objResult[fil].getValue(columnsDetalle[4]);
					var codigo 	   =  objResult[fil].getValue(columnsDetalle[5]);
					var impuesto   =  objResult[fil].getValue(columnsDetalle[6]);
					var importe    =  objResult[fil].getValue(columnsDetalle[7]);
					var preimpresofin =  objResult[fil].getValue(columnsDetalle[8]);
                    nlapiLogExecution('ERROR','preimpresofin',preimpresofin);
                	recordBMlog = nlapiCreateRecord(LOGRECORD_ID);
	            	recordBMlog.setFieldValue('custrecord_lmry_pe_bol_mas_subsi',nlapiGetSubsidiary());
	           		recordBMlog.setFieldValue('custrecord_lmry_pe_bol_mas_user',nlapiGetUser());
	            	recordBMlog.setFieldValue('custrecord_lmry_pe_bol_mas_date','Procesando');
	            	id_BMlog = nlapiSubmitRecord(recordBMlog);
                    var idinvoice = BM_invoice( fecha,codigoid,serieid,preimpresoini,preimpresofin,impuesto,importe,serie,codigo);
					nlapiLogExecution('ERROR','idinvoice',idinvoice);
					nlapiSubmitField(LOGRECORD_ID, id_BMlog, ['custrecord_lmry_pe_bol_mas_trans', 'custrecord_lmry_pe_bol_mas_date','custrecord_lmry_pe_bol_mas_pre'], [idinvoice, fecha,preimpresoini+' - '+preimpresofin]); 
                }
            }

	 	
 	}catch(err){		
		// Envia correo de error al usuario
		nlapiLogExecution('ERROR','ERROR',err);	
	}
}
function Busqueda_bol(fechaB){
	try{
	var ArrCabe = new Array();	
	 	var ArrItem = new Array();
	 	var swPrimera = true;
	 	var contS=0;
	 	nlapiLogExecution('ERROR','Fechita',fechaB);
		// Ejecuta la busqueda
		var objResultSearch = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo','customsearch_lmry_pe_ei_boleteo_masivo');
		if(fechaB!='' && fechaB!='null' && fechaB!=null){
                objResultSearch.addFilter(new nlobjSearchFilter('custrecord_lmry_pe_ei_date', null, 'on', fechaB));
            }	
		var busquedaResult	= objResultSearch.runSearch();

		while (!bolStop)
		{
			// Retorno de 1000 Registro
			var objResult = busquedaResult.getResults(intMinReg, intMaxReg);
			if (objResult!=null && objResult!='') {
				nlapiLogExecution('ERROR', 'CALCULANDO RANGO', intMinReg + ' - ' + intMaxReg);
				// Filas
				// Procesa la busqueda consultada
				var intLength = objResult.length;
				for (var fil = 0; fil < intLength; fil++){
					// Log de Errores
					nlapiLogExecution('ERROR', 'customrecord_lmry_pe_ei_boleteo_masivo: length -> ', objResult.length);

					var vali=false;
					var vali2=false;
					var columnsDetalle	=	objResult[fil].getAllColumns();
					var ii=0;
					var kk=0;
					// Estado de cuenta a Procesar
					var auxiliar = new Array();
					var auxiliar2 = new Array();
					var itemsBus = new Array();
							
					var ID         =  objResult[fil].getValue(columnsDetalle[0]);
					var serie      =  objResult[fil].getText(columnsDetalle[1]);
					var serieid    =  objResult[fil].getValue(columnsDetalle[1])
					var preimpreso =  objResult[fil].getValue(columnsDetalle[2]);
					var subsi 	   =  objResult[fil].getValue(columnsDetalle[3]);
					var cliente    =  objResult[fil].getValue(columnsDetalle[4]);
					var fecha 	   =  objResult[fil].getValue(columnsDetalle[5]);
					var codigoid   =  objResult[fil].getValue(columnsDetalle[6]);
					var codigo 	   =  objResult[fil].getValue(columnsDetalle[7]);
					var impuesto   =  objResult[fil].getValue(columnsDetalle[8]);
					var importe    =  objResult[fil].getValue(columnsDetalle[9]);
					var item 	   =  objResult[fil].getValue(columnsDetalle[10]);
					nlapiLogExecution('ERROR', 'PREIMPRESO', preimpreso);

					if(swPrimera){
						swPrimera = false;
						auxiliar[0]=cliente;
						auxiliar[1]=fecha;
						auxiliar[2]=codigoid;
						auxiliar[3]=serieid;
						auxiliar[4]=preimpreso;
						auxiliar[5]=preimpreso;
						auxiliar[6]=1;
						ArrCabe[contS]=auxiliar;

						auxiliar2[0]='1';
						auxiliar2[1]=parseFloat(importe);
						auxiliar2[2]=impuesto;
						auxiliar2[3]=codigo;
						auxiliar2[4]=serie;
						auxiliar2[5]=preimpreso;
						auxiliar2[6]=preimpreso;

						itemsBus[0]= auxiliar2;
						ArrItem[contS] = itemsBus;
						contS++;
					
						
						//nlapiLogExecution('ERROR','1',serie);
					}else{

						//nlapiLogExecution('ERROR','HOLIBOLI',ArrItem[0][0][4]);
						if(fil==objResult.length-1){
							//ultimoPreimpreso= preimpreso;
							nlapiLogExecution('ERROR','UltimoNumero',preimpreso);
						}

						//nlapiLogExecution('ERROR','CONT SERIE',contS-1);
						//nlapiLogExecution('ERROR','CONT ITEM',ArrCabe[contS-1][6]);
						
						for(var i=0; i<contS; i++){
							//nlapiLogExecution('ERROR','SERIE TABLA',ArrCabe[i][3]);
							//nlapiLogExecution('ERROR','SERIE BUSQUEDA',serieid);
							//nlapiLogExecution('ERROR','SERIE BUSQUEDA NM',serie);
							if(ArrCabe[i][3]==serieid){

								vali=true;
								ii=i;
								//nlapiLogExecution('ERROR','3',i);
								break;

							}

						}
						if(vali){
							ArrCabe[ii][5]=preimpreso;

							for(var k=0;k<ArrCabe[ii][6];k++){
								//nlapiLogExecution('ERROR','IMPUESTO TABLA',ArrItem[i][k][2]);
								//nlapiLogExecution('ERROR','IMPUESTO BUSQUE',impuesto);

								if(ArrItem[ii][k][2]==impuesto){
									vali2=true;
									kk=k;
									//nlapiLogExecution('ERROR','4',k);
									break;
								}
							}

							if(vali2){
								ArrItem[ii][kk][6]=preimpreso;
								ArrItem[ii][kk][1]= ArrItem[ii][kk][1]+parseFloat(importe);
								//nlapiLogExecution('ERROR','MISMO IMPUESTO','MISMO IMPUESTO')

							}else{
								//nlapiLogExecution('ERROR','3',ii);
								//nlapiLogExecution('ERROR','4',kk);
								//nlapiLogExecution('ERROR','TEFITA1',ArrItem[ii][0][2]);
								
								
								//nlapiLogExecution('ERROR','NUEVO ITEM1',ArrCabe[ii][6]);


							
								auxiliar2[0]=ArrCabe[ii][6]+1;
								auxiliar2[1]=parseFloat(importe);
								auxiliar2[2]=impuesto;
								auxiliar2[3]=codigo;
								auxiliar2[4]=serie;
								auxiliar2[5]=preimpreso;
								auxiliar2[6]=preimpreso;
								
								ArrItem[ii][ArrCabe[ii][6]] = auxiliar2;
								ArrCabe[ii][6]++;
								//nlapiLogExecution('ERROR','TEFITA',ArrItem[ii][1][2]);
								//nlapiLogExecution('ERROR','NUEVO ITEM',ArrCabe[ii][6]);
								//nlapiLogExecution('ERROR','HOLIBOLI',ArrItem[0][0][4]);
								//nlapiLogExecution('ERROR','HOLIBOLI1',ArrItem[0][1][4]);

							}

						}else{
							//nlapiLogExecution('ERROR','ENTROITEM',contS);
							auxiliar[0]=cliente;
							auxiliar[1]=fecha;
							auxiliar[2]=codigoid;
							auxiliar[3]=serieid;
							auxiliar[4]=preimpreso;
							auxiliar[5]=preimpreso;
							auxiliar[6]=1;
							ArrCabe[contS]=auxiliar;
							//nlapiLogExecution('ERROR','HOLIBOLI',ArrItem[0][0][4]);

							auxiliar2[0]='1';
							auxiliar2[1]=parseFloat(importe);
							auxiliar2[2]=impuesto;
							auxiliar2[3]=codigo;
							auxiliar2[4]=serie;
							auxiliar2[5]=preimpreso;
							auxiliar2[6]=preimpreso;

							itemsBus[0]= auxiliar2;
							ArrItem[contS] = itemsBus;
							//nlapiLogExecution('ERROR','HOLIBOLI',ArrItem[0][0][4]);
							//nlapiLogExecution('ERROR','HOLIBOLI',ArrItem[1][0][4]);
							contS++;
									
							//nlapiLogExecution('ERROR','NUEVOSERIE',contS);
						}
					}											
				} // Procesa la busqueda consultada
				// Quiebre de 1000 en 1000
				intMinReg = intMaxReg; 
				intMaxReg += 1000;
				if (intLength<1000){
					bolStop = true;
				}
				
			} else {
				bolStop = true;
			}
			

		} // Termina la el whileStop
		for(var z=0;z<contS;z++){
			
				nlapiLogExecution('ERROR','CAB1',ArrCabe[z][0]);
				nlapiLogExecution('ERROR','CAB2',ArrCabe[z][1]);
				nlapiLogExecution('ERROR','CAB3',ArrCabe[z][2]);
				nlapiLogExecution('ERROR','CAB4',ArrCabe[z][3]);
				nlapiLogExecution('ERROR','CAB5',ArrCabe[z][4]);
				nlapiLogExecution('ERROR','CAB6',ArrCabe[z][5]);
				nlapiLogExecution('ERROR','CAB7',ArrCabe[z][6]);
		}

		for (var a=0;a<contS;a++){
			for(var b=0;b<ArrCabe[a][6];b++){
				nlapiLogExecution('ERROR','ITEM1',ArrItem[a][b][0]);
				nlapiLogExecution('ERROR','ITEM2',ArrItem[a][b][1]);
				nlapiLogExecution('ERROR','ITEM3',ArrItem[a][b][2]);
				nlapiLogExecution('ERROR','ITEM4',ArrItem[a][b][3]);
				nlapiLogExecution('ERROR','ITEM5',ArrItem[a][b][4]);
				nlapiLogExecution('ERROR','ITEM6',ArrItem[a][b][5]);
				nlapiLogExecution('ERROR','ITEM7',ArrItem[a][b][6]);
			}
		}
		for(var i=0;i<contS;i++){
			var clienteI=ArrCabe[i][0];
			var fechaI=ArrCabe[i][1];
			var codigoidI=ArrCabe[i][2];
			var serieidI=ArrCabe[i][3];
			var primerPreimpresoI=ArrCabe[i][4];
			var ultimoPreimpresoI=ArrCabe[i][5];
			var cantItems = ArrCabe[i][6];

			var idinvoice = BM_invoice( clienteI, fechaI,codigoidI,serieidI,primerPreimpresoI,ultimoPreimpresoI,cantItems,ArrItem[i]);
			nlapiLogExecution('ERROR','idinvoice',idinvoice);


		}		
		nlapiLogExecution('ERROR','HOLI','HOLI');
		// Crea la factura
			
		
		// Log de Errores
		nlapiLogExecution('ERROR', 'BM_main_schedule -> ', 'Proceso Terminado...');
	}catch(err){		
		// Envia correo de error al usuario
		nlapiLogExecution('ERROR','ERROR',err);	
	}
}

/* ------------------------------------------------------------------------------------------------------
 * Funcion para crear la factura de un estado de cuenta de tiempos
 * --------------------------------------------------------------------------------------------------- */
function BM_invoice(Fecha,DocuTipo,DocuSeri,PrimerNumero,UltimoNumero, Impuesto,Importe,Serie,Codigo)
{	
		var idRecord = 0;

		// Valida que este configurado para la generacion de factura
		if ( DocuTipo==null || DocuSeri=='' ){
			// Log de Errores
			nlapiLogExecution('ERROR', 'law360_invoice - Falta configurar parametros-> ', DocuSeri + ' , ' + Fecha);
			
			// Termina la funcion
			return idRecord;
		}
		/**********************************************
		 * Crea el nuevo invoice 
		 *********************************************/
		
		nlapiLogExecution('ERROR','Fecha',Fecha);
		nlapiLogExecution('ERROR','DocuTipo',DocuTipo);
		nlapiLogExecution('ERROR','DocuSerie',DocuSeri);
		nlapiLogExecution('ERROR','PrimerNumero',PrimerNumero);
		nlapiLogExecution('ERROR','UltimoNumero',UltimoNumero);
		
		

		var NewRecord = nlapiCreateRecord('invoice');
			NewRecord.setFieldValue('customform',FORMULARIO); //Formulario
			NewRecord.setFieldValue('entity',CLIENTE);		// Cliente
			NewRecord.setFieldValue('location',LOCATION);// Location
  			NewRecord.setFieldValue('department',DEPA);
			NewRecord.setFieldValue('trandate', Fecha );		//Fecha	
			NewRecord.setFieldValue('custbody_lmry_document_type', DocuTipo);		// Latam - Legal Document Type
			NewRecord.setFieldValue('custbody_lmry_serie_doc_cxc', DocuSeri);		// Latam - Serie CxC
			NewRecord.setFieldValue('custbody_lmry_num_preimpreso', PrimerNumero);		// Latam - Numero Preimpreso
			NewRecord.setFieldValue('custbody_lmry_pe_num_final_preimpreso', UltimoNumero);		// Latam - Numero Final Preimpreso
var i=0;
				// Agrega el registro
				NewRecord.setLineItemValue('item', 'quantity'	, i+1, 1);
				NewRecord.setLineItemValue('item', 'item'		, i+1, ITEM);
				NewRecord.setLineItemValue('item', 'rate'		, i+1, Importe);//total de los importes Registro
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, Impuesto);//taxcode
				//NewRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', 1, 'F'); 	// With Holding Tax
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_tipo_doc'	, i+1, Codigo); // TIPODOC
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_serie_cxc'	, i+1, Serie); // Serie
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_num_ini'	, i+1, PrimerNumero); // PRIMERO
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_num_fin'	, i+1, UltimoNumero); // ULTIMO
			

			

try{
		// Graba el invoice nuevo
		idRecord = nlapiSubmitRecord(NewRecord);
		nlapiLogExecution('ERROR','PASO1','PASO1');

}catch(err){

	nlapiLogExecution('ERROR','ERRORPE', err);
}
	// Devuel el id nuevo
	return idRecord;
	
}

function getEnableFeatures(){

	// Registro Personalizado LatamReady - PE Enable Feature FEL
	var coltabla = new Array();
		coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_temp_factu');
		coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_items');
		coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_custome');
  coltabla[3] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_location');
  coltabla[4] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_depa');

	enabFeatureRecord = nlapiSearchRecord( 'customrecord_lmry_pe_ei_enable_feature'
		  , null
		  , null
		  , coltabla
		);

	if (enabFeatureRecord != null && enabFeatureRecord != '') {

		FORMULARIO     = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_temp_factu');
		nlapiLogExecution('ERROR', 'FORMULARIO', FORMULARIO);
		ITEM = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_items');
		nlapiLogExecution('ERROR', 'ITEM', ITEM);
		CLIENTE = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_custome');
		nlapiLogExecution('ERROR', 'CLIENTE', CLIENTE);
      LOCATION = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_location');
		nlapiLogExecution('ERROR', 'LOCATION', LOCATION);
      DEPA = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_depa');
		nlapiLogExecution('ERROR', 'DEPA', DEPA);

	}	
	
}

function obtenerUltimoDia(mes){
	var auxmess=0;
	nlapiLogExecution('ERROR','mes',mes);
	switch (mes) {
	case "01": case '03': case '05': case '07': case '08': case '10': case '12':
		  auxmess = 31;
		  break;
	  case '02':
		  auxmess = 28;
		  break;
	  case "04": case "06": case "09": case "11":
		  auxmess = 30;
		  break;
	  default:
		  auxmess = 0;
		  break;
	}
	
	return auxmess;
}

//-------------------------------------------------------------------------------------------------------	
// Fecha de proceso
//-------------------------------------------------------------------------------------------------------	
function PeriodoMes(periodo) {
	var auxfech = '';
	var auxanio = '';
	var auxmess = '';
	auxanio= periodo.substring(4);
	switch (periodo.substring(0, 3)) {
	case 'Ene':
		  auxmess = '01';
		  break;
	  case 'ene':
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
	  case 'Set':
		  auxmess = '09';
		  break;
	  case 'set':
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
	  default:
		  auxmess = '00';
		  break;
	}
	return auxmess;
}

