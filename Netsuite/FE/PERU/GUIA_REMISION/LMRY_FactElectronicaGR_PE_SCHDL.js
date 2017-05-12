/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Dec 2016     Ezi
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */

var objContext = nlapiGetContext();
/*
var URL_WS   = 	nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_url_comfiar_ec');
var USER     = 	nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_usuario_comfiar_ec');
var PASSWORD = 	nlapiGetContext().getSetting('SCRIPT', 'custscript_lmry_password_comfiar_ec');

var URL_WS   = 'http://test.comfiar.com.ec/tcomfiarws/';
var USER     = 'WSLatamready';
var PASSWORD = '';
*/
var URL_WS   = '';
var USER     = '';
var PASSWORD = '';
var HOST_WS     = '';
var AMBIENTE_WS = '';
var FORMATO_WS  = '';

var SesionId         = '';
var FechaVencimiento = '';
var cuitId           = '';
var puntoDeVentaId   = '';
var nroCbte          = '';
var tipoDeCbteId     = '';
var TransaccionId    = '';
var PDF              = '';
var internalId       = '';
var exito            = false;

var arrayFolio    = new Array();
var arrayItems    = new Array();

var idLogGenerado = '';

var secuencial = '';
var numAut     = '';
var tranID     = '';

var nameScript    = "LMRY_FactElectronicaGR_PE_SCHDL";

function lmry_fact_electronica_schdl(type) {

	getEnableFeatures();

	// Valida si es OneWorld
	var featuresubs = objContext.getFeature('SUBSIDIARIES');
	var paramSubsidiaria = '';	

	// Parametros
	if (featuresubs == true || featuresubs == 'T'){
		paramSubsidiaria = objContext.getSetting('SCRIPT', 'custscript_lmry_fel_sub_gr_pe');
	}
	var paramEntidad 	= objContext.getSetting('SCRIPT', 'custscript_lmry_fel_enti_gr_pe');
	var paramDateFrom 	= objContext.getSetting('SCRIPT', 'custscript_lmry_fel_datefrom_gr_pe');
	var paramDateTo 	= objContext.getSetting('SCRIPT', 'custscript_lmry_fel_dateto_gr_pe');
	var paramFactura	= objContext.getSetting('SCRIPT', 'custscript_lmry_fel_fac_gr_pe');
	//Identificador si es GR o NC
	var paramIdent		= objContext.getSetting('SCRIPT', 'custscript_lmry_fel_identi_gr_pe');
	//nlapiLogExecution('ERROR', 'paramFactura', paramFactura);

	nlapiLogExecution('ERROR', 'PARAMETROS OBTENIDOS', 'SUB: '+paramSubsidiaria+'. ENT: '+paramEntidad+'. DFR: '+paramDateFrom+' . DTO: '+paramDateTo+ ' .FAC: ' +paramFactura+' . TIPO: '+paramIdent);
	nlapiLogExecution('ERROR', 'EJECUTANDO SCHEDULE PARA CREACION XML', 'EJECUTANDO SCHEDULE PARA CREACION XML');

	// GENERANDO LOG
	var logRecord	=	nlapiCreateRecord('customrecord_lmry_pe_fel_lote_envio');
		logRecord.setFieldValue('custrecord_lmry_pe_envio_subsi', nlapiGetSubsidiary());
		logRecord.setFieldValue('custrecord_lmry_pe_envio_user', nlapiGetUser());
		logRecord.setFieldValue('custrecord_lmry_pe_envio_transac', paramFactura);
		logRecord.setFieldValue('custrecord_lmry_pe_envio_status', 'Procesando...');
		logRecord.setFieldValue('custrecord_lmry_pe_envio_iden', paramIdent); 
	idLogGenerado = nlapiSubmitRecord(logRecord);
	nlapiLogExecution('ERROR', 'Creando LOG', 'Creando LOG');


	var returnIniSesion	= WSIniSesion();

	if (returnIniSesion == 'Error') {
		nlapiSubmitField('customrecord_lmry_pe_fel_lote_envio', idLogGenerado, ['custrecord_lmry_pe_envio_status', 'custrecord_lmry_pe_envio_resp'], ['Error de autenticación', "Error al conectar al WS ComfiAr."]);
		return true;
	}
			
	try{
		//GUÍA DE REMISIÓN
		if(paramIdent == '06'){
			var busquedaTransacciones = nlapiLoadSearch('transaction', 'customsearch_lmry_info_gr_fact_elect_p_2');
		}/*else{
			var busquedaTransacciones = nlapiLoadSearch('transaction', 'customsearch_lmry_info_env_guia_elect_cl');			
		}*/

		if ((featuresubs == true || featuresubs == 'T') && paramSubsidiaria!='' && paramSubsidiaria!='null' && paramSubsidiaria!=null){
				busquedaTransacciones.addFilter(new nlobjSearchFilter('subsidiary', null, 'anyof', paramSubsidiaria));
		}
		if(paramEntidad!='' && paramEntidad!='null' && paramEntidad!=null){
			busquedaTransacciones.addFilter(new nlobjSearchFilter('entity', null, 'anyof', paramEntidad));
		}
		if(paramDateFrom!='' && paramDateFrom!='null' && paramDateFrom!=null){
			busquedaTransacciones.addFilter(new nlobjSearchFilter('trandate', null, 'onorafter', paramDateFrom));
		}
		if(paramDateTo!='' && paramDateTo!='null' && paramDateTo!=null){
			busquedaTransacciones.addFilter(new nlobjSearchFilter('trandate', null, 'onorbefore', paramDateTo));
		}
		if(paramFactura!='' && paramFactura!='null' && paramFactura!=null){
			busquedaTransacciones.addFilter(new nlobjSearchFilter('internalid', null, 'anyof', paramFactura));
		}

		var intMinTransacciones = 0;
		var intMaxTransacciones = 100;
		var objResultSetTransacciones	= busquedaTransacciones.runSearch();
		var busquedaTransaccionesStop	= false;
		var busquedaTransaccionesResult	= objResultSetTransacciones.getResults(intMinTransacciones, intMaxTransacciones);
	}catch(e){			
		nlapiSubmitField('customrecord_lmry_pe_fel_lote_envio', idLogGenerado, 'custrecord_lmry_pe_envio_status', 'Error Inesperado.');
		nlapiLogExecution('ERROR', 'CATCH BUSQUEDA', e);
		return true;
	}

	if(busquedaTransaccionesResult == null || busquedaTransaccionesResult.length == 0){
		return alert('No se han encontrado transacciones con los criterios ingresados.');
	}else{		
		while(!busquedaTransaccionesStop){			
			for(var cuentaDetalle=0; cuentaDetalle<busquedaTransaccionesResult.length; cuentaDetalle++){

				var columnsDetalle	=	busquedaTransaccionesResult[cuentaDetalle].getAllColumns();

				//LINEAS DE CABECERA
				if (cuentaDetalle == 0) {

					internalId     		=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[0]);
										
					//Serie CXC 3 primeros dig = estab y los 3 siguientes = ptoEmi
					var serieCXC        =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[1]);
						 serieCXC = 'F001';
					nlapiLogExecution('ERROR', 'serieCXC', serieCXC);
					if (serieCXC != null && serieCXC != '') {
						var estab        = 	serieCXC.substring(0,3);
						var ptoEmi       =	serieCXC.substring(4,7);
						//puntoDeVentaId	 =  parseInt(estab + ptoEmi, 10).toString();
						puntoDeVentaId = '1001';
					}
					nlapiLogExecution('ERROR', 'puntoDeVentaId', puntoDeVentaId);
					
					var secuencial    	=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[2]);
						nroCbte 		= 	secuencial;

					

					var fechaEmision	=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[3]);
						fechaEmision    =	FormatoDDMMYYY(fechaEmision);
				  
				   // nlapiLogExecution('ERROR', 'tipodeGuia', tipodeGuia);	

				    var observaciones   =   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[4]);
				    nlapiLogExecution('ERROR','OBS',observaciones)
				   

				    
				    var numDocGuiaBaja  =   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[5]);
				    var codDoc          =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[6]);
						tipoDeCbteId 	= 	codDoc;
					var tipoDeGuia      =   codDoc;
					var tipodeGuiaDoc	=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[7]);
				    
				    //REmitente
				    var remiTipoDoc		=  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[8]);
				    var remiNumDoc		=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[9]);
				    	remiNumDoc = '20536105523';
				    	cuitId 			= 	remiNumDoc;
				    var remiRazonSocial =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[10]);
					
					//Asigna secuencial y nroCbte
					var returnUltimoNroCbte = WSUltimoNroCbte();

					//Destinatario
				    var destTipoDoc		=  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[11]);
				    var destNumDoc		=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[12]);
				    var destRazonSocial =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[13]);
				    //
				    var codMotivo  		=   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[14]);
				    var motivo 			=   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[15]);
				    
				    var peso  			=   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[16]);
				    var cantidad 		=   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[17]);
				    //var modTraslado		=   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[23]);
				    var modTraslado 	= 	'01';
				    var fechaIniTrans	=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[18]);
						fechaIniTrans   =	FormatoDDMMYYY(fechaIniTrans);

					//Datos Transportista
					
					var rucTranspo  	=  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[19]);
					var razonSoTranspo  =  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[20]);
					if (razonSoTranspo != null && razonSoTranspo != '') {
						var lengthPrefijo = razonSoTranspo.split(' ')[0].length + 1;
						razonSoTranspo   = razonSoTranspo.substring(lengthPrefijo, razonSoTranspo.length);
						nlapiLogExecution('ERROR', 'lengthPrefijo', lengthPrefijo);
					}
					var placa  			=  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[21]);
					var chofer  		=  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[22]);
					var dniChofer 		=  	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[23]);

					//Datos de Llegada
					var ubigeoLlegada	=   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[24]);
					var dirLlegada     	=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[25]);
					dirLlegada='Av. Manuel Olguin 543';
						//dirLlegada      =   dirLlegada.replace(/\r\n/gi, " ");
					var numContenedor   =   busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[26]);


					//Datos de Partida
					var ubigeoPartida   =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[27]);
					var dirPartida     	=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[28]);
					dirPartida='Av. Juan Alfaro 170';
						//dirPartida      =   dirPartida.replace(/\r\n/gi, " ");
					//var codPuerto		=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[37]);
					
					tranID				=	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[29]);
																
				}		

				//+++++++++++++++++
				
				var detalleItem  = new Array();						

				var codigoInterno   =	busquedaTransaccionesResult[cuentaDetalle].getText(columnsDetalle[30]);
				detalleItem.push(codigoInterno);
				
				var cantidad        =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[31]);
					cantidad 		= 	Math.abs(cantidad);
				detalleItem.push(cantidad);
				var descripcion     =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[32]);
					//descripcion 	= 	descripcion.replace(/\r\n/gi, " ");
				detalleItem.push(descripcion);
				var codProducto		= 	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[33]);
				detalleItem.push(codProducto);

				//var serieLote 		  =	busquedaTransaccionesResult[cuentaDetalle].getText(columnsDetalle[30]);
				var serieLote		  =	busquedaTransaccionesResult[cuentaDetalle].getValue(columnsDetalle[34]);
				nlapiLogExecution('ERROR', 'serieLote', serieLote);
				//nlapiLogExecution('ERROR', 'serieLote_2', serieLote_2);
				if (serieLote != null && serieLote != '') {					
					nlapiLogExecution('ERROR', 'serieLote ENTRO', 'ENTRO ' +serieLote);
					var arraySerieLote = serieLote.split("\n");
					nlapiLogExecution('ERROR', 'arraySerieLote.length', arraySerieLote.length);

					var valorLoteSerie = "";
					for (var k = 0; k < arraySerieLote.length; k++) {	
						if (k != arraySerieLote.length - 1) {
							valorLoteSerie += arraySerieLote[k] + ", ";
						}else{
							valorLoteSerie += arraySerieLote[k];
						}	
					}
					
					for (var i = 0; i < arraySerieLote.length; i++) {
						nlapiLogExecution('ERROR', 'arraySerieLote - ' + i, arraySerieLote[i]);
					}
					detalleItem.push(valorLoteSerie);
				}

				arrayItems.push(detalleItem);			
			}

			if(busquedaTransaccionesResult.length == 1000){
				intMinTransacciones         = intMinTransacciones + 1000;
				intMaxTransacciones         = intMaxTransacciones + 1000;
				busquedaTransaccionesResult = objResultSetTransacciones.getResults(intMinTransacciones, intMaxTransacciones);
			}else{
				busquedaTransaccionesStop = true;
			}
		}
	}

	// INICIO ESTRUCTURA DE XML  ------------------------------------------

	var xmlEnvio = 
			'<?xml version="1.0" encoding="iso-8859-1"?>\n'+
			'<DespatchAdvice xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2">\n'+
			'\t<cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n'+
			'\t<cbc:CustomizationID>1.0</cbc:CustomizationID>\n'+
			'\t<cbc:ID>T001-00001931</cbc:ID>\n'+
			'\t<cbc:IssueDate>'+fechaEmision+'</cbc:IssueDate>\n'+
			'\t<cbc:DespatchAdviceTypeCode>'+tipoDeGuia+'</cbc:DespatchAdviceTypeCode>\n'+
			'\t<cbc:Note>'+observaciones+'</cbc:Note>\n'+
			
			/* OPCIONAL
			'\t<cac:OrderReference>\n'+
			'\t\t<cbc:ID>T001-8</cbc:ID>\n'+
			'\t\t<cbc:OrderTypeCode name="Guía de Remisión">09</cbc:OrderTypeCode>\n'+
			'\t</cac:OrderReference>\n'+
			'\t<cac:AdditionalDocumentReference>\n'+
			'\t\t<cbc:ID>T001-8</cbc:ID>\n'+
			'\t\t<cbc:DocumentTypeCode>06</cbc:DocumentTypeCode>\n'+
			'\t</cac:AdditionalDocumentReference>\n'+
			*/

			//Remitente
			'\t<cac:DespatchSupplierParty>\n'+			
			'\t\t<cbc:CustomerAssignedAccountID schemeID="'+remiTipoDoc+'">'+remiNumDoc+'</cbc:CustomerAssignedAccountID>\n'+
			'\t\t<cac:Party>\n'+
			'\t\t\t<cac:PartyLegalEntity>\n'+
			'\t\t\t\t<cbc:RegistrationName>'+remiRazonSocial+'</cbc:RegistrationName>\n'+
			'\t\t\t</cac:PartyLegalEntity>\n'+
			'\t\t</cac:Party>\n'+
			'\t</cac:DespatchSupplierParty>\n'+
			//Receptor
			'\t<cac:DeliveryCustomerParty>\n'+
			'\t\t<cbc:CustomerAssignedAccountID schemeID="6">'+destNumDoc+'</cbc:CustomerAssignedAccountID>\n'+
			'\t\t<cac:Party>\n'+
			'\t\t\t<cac:PartyLegalEntity>\n'+
			'\t\t\t\t<cbc:RegistrationName>'+destRazonSocial+'</cbc:RegistrationName>\n'+
			'\t\t\t</cac:PartyLegalEntity>\n'+
			'\t\t</cac:Party>\n'+
			'\t</cac:DeliveryCustomerParty>\n'+
			//Del tercero proveedor
			/*Opcional
			'\t<cac:SellerSupplierParty>\n'+
			'\t\t<cbc:CustomerAssignedAccountID schemeID="6">20100070970</cbc:CustomerAssignedAccountID>\n'+
			'\t\t<cac:Party>\n'+
			'\t\t\t<cac:PartyLegalEntity>\n'+
			'\t\t\t\t<cbc:RegistrationName>PLAZA VEA</cbc:RegistrationName>\n'+
			'\t\t\t</cac:PartyLegalEntity>\n'+
			'\t\t</cac:Party>\n'+
			'\t</cac:SellerSupplierParty>\n'+
			*/
			//Datos del envio
			'\t<cac:Shipment>\n'+
			'\t\t<cbc:ID>1</cbc:ID>\n'+
			'\t\t<cbc:HandlingCode>'+codMotivo+'</cbc:HandlingCode>\n'+
			'\t\t<cbc:Information>'+motivo+'</cbc:Information>\n'+
			'\t\t<cbc:GrossWeightMeasure unitCode="KGM">'+peso+'</cbc:GrossWeightMeasure>\n'+
			'\t\t<cbc:TotalTransportHandlingUnitQuantity>'+cantidad+'</cbc:TotalTransportHandlingUnitQuantity>\n'+
			'\t\t<cbc:SplitConsignmentIndicator>true</cbc:SplitConsignmentIndicator>\n'+
			'\t\t<cac:ShipmentStage>\n'+
			//siempre 01 osea publico
			'\t\t\t<cbc:TransportModeCode>'+modTraslado+'</cbc:TransportModeCode>\n'+
			'\t\t\t<cac:TransitPeriod>\n'+
			'\t\t\t\t<cbc:StartDate>'+fechaIniTrans+'</cbc:StartDate>\n'+
			'\t\t\t</cac:TransitPeriod>\n';
			//Transporte Privado (02) o Publico (01)
			if(modTraslado=='01'){
				xmlEnvio += '\t\t\t<cac:CarrierParty>\n'+
							'\t\t\t\t<cac:PartyIdentification>\n'+
							'\t\t\t\t\t<cbc:ID schemeID="6">'+rucTranspo+'</cbc:ID>\n'+
							'\t\t\t\t</cac:PartyIdentification>\n'+
							'\t\t\t\t<cac:PartyName>\n'+
							'\t\t\t\t\t<cbc:Name>'+razonSoTranspo+'</cbc:Name>\n'+
							'\t\t\t\t</cac:PartyName>\n'+
							'\t\t\t</cac:CarrierParty>\n'+
             				'\t\t</cac:ShipmentStage>\n';
			}else{
				xmlEnvio += '\t\t\t<cac:TransportMeans>\n'+
							'\t\t\t\t<cac:RoadTransport>\n'+			
							'\t\t\t\t\t<cbc:LicensePlateID>'+placa+'</cbc:LicensePlateID>\n'+
							'\t\t\t\t</cac:RoadTransport>\n'+
							'\t\t\t</cac:TransportMeans>\n'+
							'\t\t\t<cac:DriverPerson>\n'+
							'\t\t\t\t<cbc:ID schemeID="1">10101010</cbc:ID>\n'+
							'\t\t\t</cac:DriverPerson>\n'+
							'\t\t</cac:ShipmentStage>\n';
			}
			//PUnto de llegada
			xmlEnvio += 
			'\t\t<cac:Delivery>\n'+
			'\t\t\t<cac:DeliveryAddress>\n'+
			'\t\t\t\t<cbc:ID>'+ubigeoLlegada+'</cbc:ID>\n'+
			'\t\t\t\t<cbc:StreetName>'+dirLlegada+'</cbc:StreetName>\n'+
			'\t\t\t</cac:DeliveryAddress>\n'+
			'\t\t</cac:Delivery>\n'+
			//datos del contenedor
			'\t\t<cac:TransportHandlingUnit>\n'+
			'\t\t\t<cbc:ID>'+numContenedor+'</cbc:ID>\n'+
			//En caso si son varios carritos 
			'\t\t\t<cac:TransportEquipment>\n'+
			'\t\t\t\t<cbc:ID>'+placa+'</cbc:ID>\n'+
			'\t\t\t</cac:TransportEquipment>\n'+			
			'\t\t</cac:TransportHandlingUnit>\n'+
			//Punto de partida
			'\t\t<cac:OriginAddress>\n'+
			'\t\t\t<cbc:ID>'+ubigeoPartida+'</cbc:ID>\n'+
			'\t\t\t<cbc:StreetName>'+dirPartida+'</cbc:StreetName>\n'+
			'\t\t</cac:OriginAddress>\n'+
			'\t</cac:Shipment>\n'+

			//Datos del item
			'\t<cac:DespatchLine>\n';

			for (var i = 0; i < arrayItems.length; i++) {
				var detalle = arrayItems[i];

				xmlEnvio += 
						'\t\t<cbc:ID>'+(i+1)+'</cbc:ID>\n'+
						'\t\t<cbc:DeliveredQuantity unitCode="KGM">'+cantidad+'</cbc:DeliveredQuantity>\n'+
						'\t\t<cac:OrderLineReference>\n'+
						'\t\t\t<cbc:LineID>1</cbc:LineID>\n'+
						'\t\t</cac:OrderLineReference>\n'+
						'\t\t<cac:Item>\n'+
						'\t\t\t<cbc:Name>'+descripcion+'</cbc:Name>\n'+
						'\t\t\t<cac:SellersItemIdentification>\n'+
						'\t\t\t\t<cbc:ID>'+codProducto+'</cbc:ID>\n'+
						'\t\t\t</cac:SellersItemIdentification>\n'+
						'\t\t</cac:Item>\n';
			}
			xmlEnvio += 
					'\t</cac:DespatchLine>\n'+
					'</DespatchAdvice>\n';			


			
			

	// FIN XML ----------------------------------------------------

	nlapiLogExecution('ERROR', 'tipoDeCbteId', tipoDeCbteId);
	nlapiLogExecution('ERROR', 'nroCbte', nroCbte);
	
	//var returnAutCbtsAsinc	= WSAutCbtsAsinc(xmlEnvio);
	var returnAutCbtsSinc	= WSAutCbtsSinc(xmlEnvio);
	nlapiLogExecution('ERROR', 'transaccionId', TransaccionId);

	

	var returnSalidaTransac = '';
	if(TransaccionId != ''){
		returnSalidaTransac = WSSalidaTransac();
	}

	var returnRespCbte = WSRespCbte();
	sendMail(xmlEnvio, returnIniSesion, returnUltimoNroCbte, returnAutCbtsSinc,returnSalidaTransac, returnRespCbte, "", "");

	if (exito) {
		//var returnRespCbte     = WSRespCbte();
		var returnDescargarPdf = WSDescargarPdf();

		var type = '';
		if (tipoDeCbteId == '01' || tipoDeCbteId == '05'){
			type = 'invoice';
		}else if(tipoDeCbteId == '04'){
			type = 'creditmemo';
		}else if(tipoDeCbteId == '09'){
			type = 'itemfulfillment';
		}
		nlapiLogExecution('ERROR','ENTROEXITO','EXITO');

		nlapiSubmitField(type, internalId, ['custbody_lmry_pe_identificador_comfiar', 'custbody_lmry_num_preimpreso', 'custbody_lmry_pe_num_aut_comfiar'], [TransaccionId, secuencial, numAut]);
	}
	nlapiLogExecution('ERROR','TEFI','HoliTEfi');

	sendMail(xmlEnvio, returnIniSesion, returnUltimoNroCbte, returnAutCbtsSinc, returnSalidaTransac, returnRespCbte, returnDescargarPdf, PDF);

	nlapiLogExecution('ERROR', 'FIN', 'FIN');	
}


function WSIniSesion(){

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
        '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
        '<soap:Body>'+
        '<IniciarSesion xmlns="http://comfiar.com.ar/webservice/">'+
        '	<usuarioId>'+USER+'</usuarioId>'+
        '	<password>'+PASSWORD+'</password>'+
        '</IniciarSesion>'+
        '</soap:Body>'+
        '</soap:Envelope>';	    

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/IniciarSesion";
		    
	var objIniSesion	=	nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var returnIniSesion = objIniSesion.getBody();
		returnIniSesion = replaceXML(returnIniSesion);

	var sesion = returnIniSesion.split('SesionId')[1];
	if(sesion != null && sesion != ''){
		SesionId = sesion.substring(1, sesion.length-2);
		FechaVencimiento = returnIniSesion.split('FechaVencimiento')[1];
		FechaVencimiento = FechaVencimiento.substring(1, FechaVencimiento.length-2);
	}else{
		return 'Error';
	}

	nlapiLogExecution('ERROR', 'SesionId - FechaVencimiento', SesionId + ' - ' + FechaVencimiento);
	nlapiLogExecution('ERROR', 'WSIniSesion', 'FIN WSIniSesion');

	return returnIniSesion;
}	

function WSAutCbtsAsinc(xml){
	
	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		'<soap:Body>'+
		    '<AutorizarComprobantesAsincronico xmlns="http://comfiar.com.ar/webservice/">'+
		      '<XML><![CDATA['+xml+']]></XML>'+
		      '<cuitAProcesar>'+cuitId+'</cuitAProcesar>'+
		      '<puntoDeVentaId>'+puntoDeVentaId+'</puntoDeVentaId>'+
		      '<tipoDeComprobanteId>'+tipoDeCbteId+'</tipoDeComprobanteId>'+
		      '<formatoId>'+FORMATO_WS+'</formatoId>'+
		      '<token>'+
		        '<SesionId>'+SesionId+'</SesionId>'+
		        '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
		      '</token>'+
		    '</AutorizarComprobantesAsincronico>'+
		  '</soap:Body>'+
		'</soap:Envelope>'; 

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/AutorizarComprobantesAsincronico";
		    
	var objAutCbtsAsinc	=	nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var returnAutCbtsAsinc = objAutCbtsAsinc.getBody();
   		returnAutCbtsAsinc = replaceXML(returnAutCbtsAsinc);
    
    
    //var AutCbtsAsincResult = returnAutCbtsAsinc.split('AutorizarComprobantesAsincronicoResult')[1];
    var SalidaTransaccion = returnAutCbtsAsinc.split('SalidaTransaccion')[1];
	if(SalidaTransaccion != null && SalidaTransaccion != ''){
		var TransacId = SalidaTransaccion.split('ID')[1];
		if(TransacId != null && TransacId != ''){
			TransaccionId = TransacId.substring(1, TransacId.length-2);
		}
		nlapiLogExecution('ERROR', 'TransaccionId', TransaccionId);
	}

	nlapiLogExecution('ERROR', 'WSAutCbtsAsinc', 'FIN WSAutCbtsAsinc');
	
	return returnAutCbtsAsinc;
}

function WSAutCbtsSinc(xml){
	
	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		'<soap:Body>'+
		    '<AutorizarComprobantesSincronico xmlns="http://comfiar.com.ar/webservice/">'+
		      '<XML><![CDATA['+xml+']]></XML>'+
		      '<cuitAProcesar>'+cuitId+'</cuitAProcesar>'+
		      '<puntoDeVentaId>'+puntoDeVentaId+'</puntoDeVentaId>'+
		      '<tipoDeComprobanteId>'+tipoDeCbteId+'</tipoDeComprobanteId>'+
		      '<formatoId>'+FORMATO_WS+'</formatoId>'+
		      '<token>'+
		        '<SesionId>'+SesionId+'</SesionId>'+
		        '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
		      '</token>'+
		    '</AutorizarComprobantesSincronico>'+
		  '</soap:Body>'+
		'</soap:Envelope>'; 

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/AutorizarComprobantesSincronico";
		    
	var objAutCbtsSinc	=	nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var returnAutCbtsSinc = objAutCbtsSinc.getBody();
   		returnAutCbtsSinc = replaceXML(returnAutCbtsSinc); 
   		nlapiLogExecution('ERROR','autSinc',returnAutCbtsSinc);   
    
    //var AutCbtsAsincResult = returnAutCbtsAsinc.split('AutorizarComprobantesAsincronicoResult')[1];
    var TransacId = returnAutCbtsSinc.split('TransaccionId')[1];
	nlapiLogExecution('ERROR','TransacId',TransacId);
	if(TransacId != null && TransacId != ''){
		TransaccionId = TransacId.substring(1, TransacId.length-2);
	}

	var SalidaTransaccion = returnAutCbtsSinc.split('Transaccion>')[1];
	nlapiLogExecution('ERROR','SalidaTransaccionSINC',SalidaTransaccion);
	if(SalidaTransaccion != null && SalidaTransaccion != ''){
		var ID = SalidaTransaccion.split('ID')[1];
		if(ID != null && ID != ''){
			TransaccionId = ID.substring(1, ID.length-2);
		}
	}
	nlapiLogExecution('ERROR','TransaccionIDSINC',TransaccionId);
	nlapiLogExecution('ERROR', 'cuitId - puntoDeVentaId - tipoDeCbteId', 
		cuitId + ' - ' + puntoDeVentaId + ' - ' + tipoDeCbteId);

	nlapiLogExecution('ERROR', 'WSAutCbtsSinc', 'FIN WSAutCbtsSinc');

	return returnAutCbtsSinc;
}

function WSSalidaTransac(){

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		  '<soap:Body>'+
		    '<SalidaTransaccion xmlns="http://comfiar.com.ar/webservice/">'+
		      '<cuitId>'+cuitId+'</cuitId>'+
		      '<transaccionId>'+TransaccionId+'</transaccionId>'+
		      '<token>'+
		        '<SesionId>'+SesionId+'</SesionId>'+
		        '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
		      '</token>'+
		    '</SalidaTransaccion>'+
		  '</soap:Body>'+
		'</soap:Envelope>'; 

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/SalidaTransaccion";
		    
	var objSalidaTransac	=	nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var returnSalidaTransac	= objSalidaTransac.getBody();
		returnSalidaTransac = replaceXML(returnSalidaTransac);
		nlapiLogExecution('ERROR','SalidaTransac',returnSalidaTransac);
		

	var estado = returnSalidaTransac.split('Estado>')[1];
	nlapiLogExecution('ERROR','ESTADOS',estado);
		var error = returnSalidaTransac.split('Error>')[2];
		if(estado != null && estado != ''){	

				
			estado = estado.substring(0, estado.length-2);
			if (estado == 'ACEPTADO' || estado == 'AUTORIZADO') {
				exito = true;
				estado_comfiar = estado;
				nlapiLogExecution('ERROR','ENTRO ACEPTADO','ACEPTADO');

			/*var numAutComfiAr = returnSalidaTransac.split('numeroAutorizacion')[1];
                numAutComfiAr = numAutComfiAr.substring(1, numAutComfiAr.length-2);
            if(numAutComfiAr != null && numAutComfiAr != ''){               
                numAut = numAutComfiAr;
            }*/

			//MENSAJE DE EXITO			
			nlapiSubmitField('customrecord_lmry_pe_fel_lote_envio', idLogGenerado, ['custrecord_lmry_pe_envio_status', 'custrecord_lmry_pe_envio_resp'], [estado, "Transaccion ID: " + TransaccionId]);
	
		}else{

			var arrayMensaje = returnSalidaTransac.split('mensaje>');
			var mensajeError = 'Errores Encontrados: \n';	
			for (var i = 2; i < arrayMensaje.length; i=i+4) {
				var mensaje = arrayMensaje[i].substring(0, arrayMensaje[i].length-2);
				mensajeError += mensaje + '\n';
			}
			mensajeError = mensajeError.substr(0, 300);

			//SE GUARDA MENSAJE ERROR			
			nlapiSubmitField('customrecord_lmry_pe_fel_lote_envio', idLogGenerado, ['custrecord_lmry_pe_envio_status', 'custrecord_lmry_pe_envio_resp'], ["RECHAZADO", mensajeError]);

		}
	}

	nlapiLogExecution('ERROR', 'WSSalidaTransac', 'FIN WSSalidaTransac');

	return returnSalidaTransac;
}

function WSRespCbte(){

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		  '<soap:Body>'+
		    '<RespuestaComprobante xmlns="http://comfiar.com.ar/webservice/">'+
		      '<cuitId>'+cuitId+'</cuitId>'+
		      '<puntoDeVentaId>'+puntoDeVentaId+'</puntoDeVentaId>'+
		      '<tipoDeComprobanteId>'+tipoDeCbteId+'</tipoDeComprobanteId>'+
		      '<nroCbte>'+nroCbte+'</nroCbte>'+
		      '<token>'+
		        '<SesionId>'+SesionId+'</SesionId>'+
		        '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
		      '</token>'+
		    '</RespuestaComprobante>'+
		  '</soap:Body>'+
		'</soap:Envelope>';	    

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/RespuestaComprobante";
		    
	
	var objRespCbte	   = nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var returnRespCbte = objRespCbte.getBody();
		returnRespCbte = replaceXML(returnRespCbte);

	nlapiLogExecution('ERROR', 'cuitId - puntoDeVentaId - tipoDeCbteId - nroCbte', 
		cuitId + ' - ' + puntoDeVentaId + ' - ' + tipoDeCbteId + ' - ' + nroCbte);
	nlapiLogExecution('ERROR', 'WSRespCbte', 'FIN WSRespCbte');

	return returnRespCbte;
}

function WSUltimoNroCbte(){

	nlapiLogExecution('ERROR', 'DATOS ENTRADA', cuitId+ ' - ' +puntoDeVentaId+ ' - ' +tipoDeCbteId+ ' - ' +SesionId+ ' - ' +FechaVencimiento);

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		'  <soap:Body>'+
		'    <UltimoNumeroComprobante xmlns="http://comfiar.com.ar/webservice/">'+
		'      <cuitId>'+cuitId+'</cuitId>'+
		'      <puntoDeVentaId>'+puntoDeVentaId+'</puntoDeVentaId>'+
		'      <tipoDeComprobanteId>'+tipoDeCbteId+'</tipoDeComprobanteId>'+
		'      <token>'+
		'        <SesionId>'+SesionId+'</SesionId>'+
		'        <FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
		'      </token>'+
		'    </UltimoNumeroComprobante>'+
		'  </soap:Body>'+
		'</soap:Envelope>';

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/UltimoNumeroComprobante";
		
	    
	var returnUltimoNroCbte = nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var UltimoNroCbteResult = returnUltimoNroCbte.getBody().split('UltimoNumeroComprobanteResult')[1];
	if(UltimoNroCbteResult != null && UltimoNroCbteResult != ''){	

		secuencial = UltimoNroCbteResult.substring(1, UltimoNroCbteResult.length-2);
		secuencial++;

		secuencial = "" + secuencial;
		var pad = "000000000";
			secuencial = pad.substring(0, pad.length - secuencial.length) + secuencial;
			nroCbte = secuencial;
		nlapiLogExecution('ERROR', 'secuencial', secuencial);
	}

	nlapiLogExecution('ERROR', 'WSUltimoNroCbte', 'FIN WSUltimoNroCbte');

	return returnUltimoNroCbte.getBody();
}

function WSDescargarPdf(){

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		'  <soap:Body>'+
		'    <DescargarPdf xmlns="http://comfiar.com.ar/webservice/">'+
		'      <transaccionId>'+TransaccionId+'</transaccionId>'+
		'      <cuitId>'+cuitId+'</cuitId>'+
		'      <puntoDeVentaId>'+puntoDeVentaId+'</puntoDeVentaId>'+
		'      <tipoComprobanteId>'+tipoDeCbteId+'</tipoComprobanteId>'+
		'      <numeroComprobante>'+nroCbte+'</numeroComprobante>'+
		'      <token>'+
		'        <SesionId>'+SesionId+'</SesionId>'+
		'        <FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
		'      </token>'+
		'    </DescargarPdf>'+
		'  </soap:Body>'+
		'</soap:Envelope>';

	var soapHeaders = new Array(); 
		soapHeaders['Host'] = HOST_WS;
		soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
		soapHeaders['Content-Length'] = 'length';
		soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/DescargarPdf";
		    
	var returnDescargarPdf	   = nlapiRequestURL(URL_WS, StringXML, soapHeaders);

	var DescargarPdfResult = returnDescargarPdf.getBody().split('DescargarPdfResult')[1];
	if(DescargarPdfResult != null && DescargarPdfResult != ''){
		PDF = DescargarPdfResult.substring(1, DescargarPdfResult.length-2);
	}

	nlapiLogExecution('ERROR', 'WSDescargarPdf', 'FIN WSDescargarPdf');

	return returnDescargarPdf.getBody();
}

function replaceString(cadena){
	var nuevaCadena = '';
	nuevaCadena =	nuevaCadena + cadena;
	nuevaCadena	=	nuevaCadena.replace(/á/g, 'a');
	nuevaCadena	=	nuevaCadena.replace(/é/g, 'e');
	nuevaCadena	=	nuevaCadena.replace(/í/g, 'i');
	nuevaCadena	=	nuevaCadena.replace(/ó/g, 'o');
	nuevaCadena	=	nuevaCadena.replace(/ú/g, 'u');
	nuevaCadena	=	nuevaCadena.replace(/Á/g, 'A');
	nuevaCadena	=	nuevaCadena.replace(/É/g, 'E');
	nuevaCadena	=	nuevaCadena.replace(/Í/g, 'I');
	nuevaCadena	=	nuevaCadena.replace(/Ó/g, 'O');
	nuevaCadena	=	nuevaCadena.replace(/Ú/g, 'U');
	nuevaCadena	=	nuevaCadena.replace(/°/g, '');
	nuevaCadena	=	nuevaCadena.replace(/|/g, '');
	nuevaCadena	=	nuevaCadena.replace(/ñ/g, 'n');
	nuevaCadena	=	nuevaCadena.replace(/Ñ/g, 'N');
	nuevaCadena	=	nuevaCadena.replace(/,/g, ' ');
	nuevaCadena	=	nuevaCadena.replace(/;/g, ' ');
	nuevaCadena	=	nuevaCadena.replace(/</g, ' ');
	nuevaCadena	=	nuevaCadena.replace(/>/g, ' ');
	nuevaCadena	=	nuevaCadena.replace(/â/g, ' ');
	nuevaCadena	=	nuevaCadena.replace(/“/g, '');
	nuevaCadena	=	nuevaCadena.replace(/€/g, '');
//	nuevaCadena	=	nuevaCadena.replace(/\n/g, ' ');
	nuevaCadena	=	nuevaCadena.replace(/#/g, '');
	nuevaCadena	=	nuevaCadena.replace(/\//g, '');
	nuevaCadena	=	nuevaCadena.replace(/Â/g, '');
	nuevaCadena	=	nuevaCadena.replace(/º/g, '');
	return nuevaCadena;
}


function fechaDiaMesAnio(fecha){
	var fechaOrdenada = '';
	var partFecha = fecha.split('/');
	fechaOrdenada = partFecha[1]+'/'+partFecha[0]+'/'+partFecha[2];
	return fechaOrdenada;
}

function FormatoDDMMYYY(fecha){
	var f = nlapiStringToDate(fecha);
	var d = f.getDate();
	var m = f.getMonth()+1;
	var y = f.getFullYear();
	 m = m + '';
        if (m.length == 1) {
            m = '0' + m;
        }
        d = d + '';
        if (d.length == 1) {
            d = '0' + d;
        }
	var fechaOrden = y+'-'+m+'-'+d;
		//fechaOrden = retornaValorFecha(fechaOrden);
	return fechaOrden;
}
	
function sendMail(content, WSIniSesion, WSUltimoNroCbte, WSAutCbtsSinc, WSSalidaTransac, WSRespCbte, WSDescargarPdf, PDF){

	var currentuser = nlapiGetUser();
	var recEmp      = nlapiLookupField('employee',currentuser,['firstname','email']);
	var nameUser    = recEmp.firstname;
	var emailUser   = recEmp.email;
			
	var body = 	'<table style="border:lightgrey 15px solid;" width="750">';
		body += '<td style="padding-left:13pt; padding-right:13pt; padding-bottom:13pt; color:#585858; font-size:15px;">';
		body += '<img src="https://system.na1.netsuite.com/core/media/media.nl?id=370&c=TSTDRV1038915&h=4b1ae4e745fe6134cb15" width="300" height="150" />';
		body += '<hr>';
		body += '<p><span style="color:#01A9DB; font-size:16px;"><b>Estimado cliente ' + nameUser + ':</b></span></p>';
		body += '<hr>';
		body += '<p style="padding-bottom:12px;">Este es un mensaje desde NetSuite LatamReady. </p>';
	if (exito) {
		body += '<p>Se ha generado la Guía de Remisión Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b>.</p>';
	}else{
		body += '<p>Se produjo un error al emitir la Guía de Remisión Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b>.</p>';
	}
		body += '<br>';
		body += '<p>Saludos Cordiales,</p>';
		body += 'El equipo de LatamReady';
		body += '<br>';
		body += '<a style="font-size:13px" href="http://www.latamready.com/">www.LatamReady.com</a>';
		body += '<br><br>';
		body += '<p><strong>*** NO RESPONDA A ESTE MENSAJE ***</strong></p>';
		body += '<br>';
		body += '<hr>';	
		body += '<br><br>';
		body += '<img src="https://system.na1.netsuite.com/core/media/media.nl?id=552&c=TSTDRV1038915&h=d2823d71514640fd9a37" align="right"/>';
		body += '</td>';
		body += '</table>';
	
	var fileXML = new Array();

	var i = 0;
	var FileName = 'Guía de Remisión Electronica - PERU.xml';

	if(content != null && content != ''){
		fileXML[0] = nlapiCreateFile(FileName, 'XMLDOC', content);
		i++;
	}
	if(WSIniSesion != null && WSIniSesion != ''){
		fileXML[i] = nlapiCreateFile("Response IniciarSesion.xml", 'XMLDOC', WSIniSesion);
		i++;
	}
	if(WSUltimoNroCbte != null && WSUltimoNroCbte != ''){
		fileXML[i] = nlapiCreateFile("Response UltimoNroCbte.xml", 'XMLDOC', WSUltimoNroCbte);
		i++;
	}		
	if(WSAutCbtsSinc != null && WSAutCbtsSinc != ''){
		fileXML[i] = nlapiCreateFile("Response AutorizarComprobantesSincronico.xml", 'XMLDOC', WSAutCbtsSinc);
		i++;
	}
	if(WSSalidaTransac != null && WSSalidaTransac != ''){
		fileXML[i] = nlapiCreateFile("Response Salida Transaccion.xml", 'XMLDOC', WSSalidaTransac);
		i++;
	}
	if(WSRespCbte != null && WSRespCbte != ''){
		fileXML[i] = nlapiCreateFile("Response RespuestaComprobante.xml", 'XMLDOC', WSRespCbte);
		i++;
	}
	if(WSDescargarPdf != null && WSDescargarPdf != ''){
		fileXML[i] = nlapiCreateFile("Response DescargarPdf.xml", 'XMLDOC', WSDescargarPdf);
		i++;
	}
	if(PDF != null && PDF != ''){
		fileXML[i] = nlapiCreateFile("Response PDF.pdf", 'PDF', PDF);
		i++;
	}					
	var newEmail = nlapiSendEmail(currentuser, emailUser, 'LatamReady - Guía de Remisión Electronica PE: ' + tranID, 
						body, null, null, null, fileXML);

	nlapiLogExecution('ERROR', 'SE ENVIO CORREO', FileName);
}

function retornaValorFecha(valor){
	valor = valor+'';
	if(valor.substr(1,1)=='/'){
		valor = '0'+valor;
	}
	if(valor.substr(4,1)=='/'){
		valor = valor.split('/')[0]+'/0'+valor.split('/')[1]+'/'+valor.split('/')[2];
	}
	//valor = fechaDiaMesAnio(valor);
	return valor;
}

function replaceXML(xml){
	xml = xml.replace(/&lt;/g, '<');
    xml = xml.replace(/&gt;/g, '>');
    xml = xml.replace(/&amp;lt;/g, '<');
    xml = xml.replace(/&amp;gt;/g, '>');

    return xml;
}

function getEnableFeatures(){

	// Registro Personalizado LatamReady - PE Enable Feature FEL
	var coltabla = new Array();
		coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_usuario_ws');
		coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_password_ws');
		coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_url_acceso_ws');
		coltabla[3] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_host_ws');
		coltabla[4] =  new nlobjSearchColumn('custrecord_lmry_pe_ambiente_ws');
		coltabla[5] =  new nlobjSearchColumn('custrecord_lmry_pe_formatoid_ws');

	enabFeatureRecord = nlapiSearchRecord( 'customrecord_lmry_pe_fel_enable_feature'
		  , null
		  , null
		  , coltabla
		);

	if (enabFeatureRecord != null && enabFeatureRecord != '') {

		USER     = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_usuario_ws');
		nlapiLogExecution('ERROR', 'USER', USER);
		PASSWORD = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_password_ws');
		nlapiLogExecution('ERROR', 'PASSWORD', PASSWORD);
		URL_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_url_acceso_ws');
		nlapiLogExecution('ERROR', 'URL_WS', URL_WS);
		HOST_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_host_ws');
		nlapiLogExecution('ERROR', 'HOST_WS', HOST_WS);
		AMBIENTE_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ambiente_ws');
		nlapiLogExecution('ERROR', 'AMBIENTE_WS', AMBIENTE_WS);
		FORMATO_WS   = enabFeatureRecord[0].getValue('custrecord_lmry_pe_formatoid_ws');
		nlapiLogExecution('ERROR', 'FORMATO_WS', FORMATO_WS);

	}	
	
}