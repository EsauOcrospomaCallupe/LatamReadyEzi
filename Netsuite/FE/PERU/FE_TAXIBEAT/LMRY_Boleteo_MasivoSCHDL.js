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

// Empieza el proceso del Schedule
function BM_main_schedule()
{
	try {	
		getEnableFeatures();
	 	var itemsBus = new Array();	
	 	var ArrCabe = new Array();	
	 	var ArrItem = new Array();
		// Ejecuta la busqueda
		var objResultSearch = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo','customsearch_lmry_pe_ei_boleteo_masivo');	
		var busquedaResult	= objResultSearch.runSearch();
		var objResult	= busquedaResult.getResults(0, 1000);
		
		if (objResult!='' && objResult!=null)
		{
			if (objResult.length>0)
			{
				// Log de Errores
				nlapiLogExecution('ERROR', 'customrecord_lmry_pe_ei_boleteo_masivo: length -> ', objResult.length);

				// Procesa la busqueda consultada
				var contS=0;
				var contI=0;

				var fil = 0;
				var primerPreimpreso ='';
				var ultimoPreimpreso ='';
				while ( fil<objResult.length )
				{
					var vali=false;
					var vali2=false;
					var columnsDetalle	=	objResult[fil].getAllColumns();
					var ii=0;
					var kk=0;
					// Estado de cuenta a Procesar
					var auxiliar = new Array();
					var auxiliar2 = new Array();
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

					if(fil==0){
						
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
					
						
						nlapiLogExecution('ERROR','1',serie);
					}else{

						nlapiLogExecution('ERROR','HOLIBOLI',ArrItem[0][0][4])
						if(fil==objResult.length-1){
							//ultimoPreimpreso= preimpreso;
							nlapiLogExecution('ERROR','UltimoNumero',preimpreso);
						}

						nlapiLogExecution('ERROR','CONT SERIE',contS-1);
						nlapiLogExecution('ERROR','CONT ITEM',ArrCabe[contS-1][6]);
						
						for(var i=0; i<contS; i++){
							nlapiLogExecution('ERROR','SERIE TABLA',ArrCabe[i][3]);
							nlapiLogExecution('ERROR','SERIE BUSQUEDA',serieid);
							nlapiLogExecution('ERROR','SERIE BUSQUEDA NM',serie);
							if(ArrCabe[i][3]==serieid){

								vali=true;
								ii=i;
								nlapiLogExecution('ERROR','3',i);
								break;

							}

						}
						if(vali){
							ArrCabe[ii][5]=preimpreso;

							for(var k=0;k<ArrCabe[ii][6];k++){
								nlapiLogExecution('ERROR','IMPUESTO TABLA',ArrItem[i][k][2]);
								nlapiLogExecution('ERROR','IMPUESTO BUSQUE',impuesto);

								if(ArrItem[ii][k][2]==impuesto){
									vali2=true;
									kk=k;
									nlapiLogExecution('ERROR','4',k);
									break;
								}
							}

							if(vali2){
								ArrItem[ii][kk][6]=preimpreso;
								ArrItem[ii][kk][1]= ArrItem[ii][kk][1]+parseFloat(importe);
								nlapiLogExecution('ERROR','MISMO IMPUESTO','MISMO IMPUESTO')

							}else{
								nlapiLogExecution('ERROR','3',ii);
								nlapiLogExecution('ERROR','4',kk);
								nlapiLogExecution('ERROR','TEFITA1',ArrItem[ii][0][2]);
								
								
								nlapiLogExecution('ERROR','NUEVO ITEM1',ArrCabe[ii][6]);
							
								auxiliar2[0]=ArrCabe[ii][6]+1;
								auxiliar2[1]=parseFloat(importe);
								auxiliar2[2]=impuesto;
								auxiliar2[3]=codigo;
								auxiliar2[4]=serie;
								auxiliar2[5]=preimpreso;
								auxiliar2[6]=preimpreso;

								itemsBus[ArrCabe[ii][6]]= auxiliar2;
								ArrItem[ii] = itemsBus;
								ArrCabe[ii][6]++;
								nlapiLogExecution('ERROR','TEFITA',ArrItem[ii][1][2]);
								nlapiLogExecution('ERROR','NUEVO ITEM',ArrCabe[ii][6]);

							}

						}else{
							nlapiLogExecution('ERROR','ENTROITEM',contS);
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
									
							nlapiLogExecution('ERROR','NUEVOSERIE',contS);
						}
					}						
						// Siguiente Registro
						fil++;
						
				} // Procesa la busqueda consultada

				if(objResult.length==1000){
					var objResult	= busquedaResult.getResults(1000, 1100);
				}
			}

		} // Termina la busqueda
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
function BM_invoice(Cliente,Fecha,DocuTipo,DocuSeri,PrimerNumero,UltimoNumero,CantItems, ArrItem)
{	
			
		//var invoice_entity  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_expense_entity');
		//var invoice_item  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_item');
		//var invoice_taxc  = objContext.getSetting('SCRIPT', 'custscript_lmry_law360_invoice_taxcode');
		var idRecord = 0;

		// Valida que este configurado para la generacion de factura
		if (Cliente=='' || DocuTipo==null || DocuSeri=='' ){
			// Log de Errores
			nlapiLogExecution('ERROR', 'law360_invoice - Falta configurar parametros-> ', DocuSeri + ' , ' + Fecha);
			
			// Termina la funcion
			return idRecord;
		}
		
		var items= new Array();
		items=ArrItem;

		/**********************************************
		 * Crea el nuevo invoice 
		 *********************************************/
		nlapiLogExecution('ERROR','subsi',Cliente);
		nlapiLogExecution('ERROR','Fecha',Fecha);
		nlapiLogExecution('ERROR','DocuTipo',DocuTipo);
		nlapiLogExecution('ERROR','DocuSerie',DocuSeri);
		nlapiLogExecution('ERROR','PrimerNumero',PrimerNumero);
		nlapiLogExecution('ERROR','UltimoNumero',UltimoNumero);
		nlapiLogExecution('ERROR','CantidadItems',CantItems);
		

		var NewRecord = nlapiCreateRecord('invoice');
			NewRecord.setFieldValue('customform',FORMULARIO); //Formulario
			NewRecord.setFieldValue('entity',Cliente );		// Cliente
			NewRecord.setFieldValue('location',LOCATION);// Location
			NewRecord.setFieldValue('trandate', Fecha );		//Fecha	
			NewRecord.setFieldValue('custbody_lmry_document_type', DocuTipo);		// Latam - Legal Document Type
			NewRecord.setFieldValue('custbody_lmry_serie_doc_cxc', DocuSeri);		// Latam - Serie CxC
			NewRecord.setFieldValue('custbody_lmry_num_preimpreso', PrimerNumero);		// Latam - Numero Preimpreso
			NewRecord.setFieldValue('custbody_lmry_pe_num_final_preimpreso', UltimoNumero);		// Latam - Numero Final Preimpreso

			for(var i=0; i<CantItems; i++){

				nlapiLogExecution('ERROR','item0',items[i][0]);
				nlapiLogExecution('ERROR','item1',items[i][1]);
				nlapiLogExecution('ERROR','item2',items[i][2]);
				nlapiLogExecution('ERROR','item3',items[i][3]);
				nlapiLogExecution('ERROR','item4',items[i][4]);
				nlapiLogExecution('ERROR','item5',items[i][5]);
				nlapiLogExecution('ERROR','item6',items[i][6]);

				// Agrega el registro
				NewRecord.setLineItemValue('item', 'quantity'	, i+1, 1);
				NewRecord.setLineItemValue('item', 'item'		, i+1, ITEM);
				NewRecord.setLineItemValue('item', 'rate'		, i+1, items[i][1]);//total de los importes Registro
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, items[i][2]);//taxcode
				//NewRecord.setLineItemValue('item', 'custcol_4601_witaxapplies', 1, 'F'); 	// With Holding Tax
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_tipo_doc'	, i+1, items[i][3]); // TIPODOC
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_serie_cxc'	, i+1, items[i][4]); // Serie
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_num_ini'	, i+1, items[i][5]); // PRIMERO
				NewRecord.setLineItemValue('item', 'custcol_lmry_col_num_fin'	, i+1, items[i][6]); // ULTIMO
			}

			

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
		coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_ei_location');

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
		LOCATION = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ei_location');
		nlapiLogExecution('ERROR', 'LOCATION', LOCATION);

	}	
	
}
