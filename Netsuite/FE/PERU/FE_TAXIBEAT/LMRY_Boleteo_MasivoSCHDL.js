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

		// Ejecuta la busqueda
		var objResultSearch = nlapiLoadSearch('customrecord_lmry_pe_ei_boleteo_masivo','customsearch_lmry_pe_ei_boleteo_masivo');	
		var busquedaResult	= objResultSearch.runSearch();
		var objResult	= busquedaResult.getResults(0, 100);
		
		if (objResult!='' && objResult!=null)
		{
			if (objResult.length>0)
			{
				// Log de Errores
				nlapiLogExecution('ERROR', 'customrecord_lmry_pe_ei_boleteo_masivo: length -> ', objResult.length);

				// Procesa la busqueda consultada
				var cont=0;
				var fil = 0;
				var primerPreimpreso ='';
				var ultimoPreimpreso ='';
				while ( fil<objResult.length )
				{
					var vali=false;
					var columnsDetalle	=	objResult[fil].getAllColumns();
					
					// Estado de cuenta a Procesar
					var auxiliar = new Array();
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
					nlapiLogExecution('ERROR', 'importe', importe);

					if(fil==0){
						auxiliar[0]=item;
						auxiliar[1]=parseFloat(importe);
						auxiliar[2]=impuesto;
						auxiliar[3]=codigo;
						auxiliar[4]=serie;
						auxiliar[5]=preimpreso;
						auxiliar[6]=preimpreso;

						itemsBus[cont]= auxiliar;
						cont++;
						primerPreimpreso= Preimpres;
						nlapiLogExecution('ERROR','1',primerPreimpreso);
					}else{

						if(fil==objResult.length-1){
							ultimoPreimpreso= preimpreso;
							nlapiLogExecution('ERROR','2',ultimoPreimpreso);
						}

						nlapiLogExecution('ERROR','2.5',itemsBus.length);
						
						for(var i=0; i<itemsBus.length; i++){
							nlapiLogExecution('ERROR','2.6',itemsBus[i][4]);

							if(itemsBus[i][4]==serie){

								vali=true;
								nlapiLogExecution('ERROR','3',i);
								break;
							}

						}
						if(vali){
							itemsBus[i][1]= itemsBus[i][1]+ parseFloat(importe);
							itemsBus[i][6]= preimpreso;
							nlapiLogExecution('ERROR','4',itemsBus[i][1]);
							nlapiLogExecution('ERROR','5',itemsBus[i][6]);

						}else{
							itemsBus[cont][0]=item;
							itemsBus[cont][1]=importe;
							itemsBus[cont][2]=impuesto;
							itemsBus[cont][3]=codigo;
							itemsBus[cont][4]=serie;
							itemsBus[cont][5]=preimpreso;
							itemsBus[cont][6]=preimpreso;

							nlapiLogExecution('ERROR','ENTRONUEVO','ENTRONUEVO');
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
				
		nlapiLogExecution('ERROR','HOLI','HOLI');
		// Crea la factura
		var idinvoice = BM_invoice( cliente, fecha,codigoid,serieid,primerPreimpreso,ultimoPreimpreso,itemsBus);
		nlapiLogExecution('ERROR','idinvoice',idinvoice);	
		
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
function BM_invoice(Cliente,Fecha,DocuTipo,DocuSeri,PrimerNumero,UltimoNumero, ArrItem)
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
		

		var NewRecord = nlapiCreateRecord('invoice');
			NewRecord.setFieldValue('customform',FORMULARIO); //Formulario
			NewRecord.setFieldValue('entity',Cliente );		// Cliente
			NewRecord.setFieldValue('location',LOCATION);// Location
			NewRecord.setFieldValue('trandate', Fecha );		//Fecha	
			NewRecord.setFieldValue('custbody_lmry_document_type', DocuTipo);		// Latam - Legal Document Type
			NewRecord.setFieldValue('custbody_lmry_serie_doc_cxc', DocuSeri);		// Latam - Serie CxC
			NewRecord.setFieldValue('custbody_lmry_num_preimpreso', PrimerNumero);		// Latam - Numero Preimpreso
			NewRecord.setFieldValue('custbody_lmry_pe_num_final_preimpreso', UltimoNumero);		// Latam - Numero Final Preimpreso

			for(var i=0; i<items.length; i++){

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
				NewRecord.setLineItemValue('item', 'taxcode'	, i+1, '1019');
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
