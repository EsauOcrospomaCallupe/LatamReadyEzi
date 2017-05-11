/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Nov 2014     LatamReady Consultor
 * File : LMRY_PEFactElectronicaImpresionSTLT.js
 */
var objContext = nlapiGetContext();
/**
 * paramRUTCliente = '10821074-5';
 * paramRUTUsuario = '25000001-4';
 * paramContrasena = 'nubox.co';
 * URLEnvioArchivo = 'https://www.nubox.com/ServiFacturaCert/WebServices/ArchivoDeVentasElectronicas.asmx';
 */

var HOST_WS = "";
var USER = "";
var PASSWORD = "";
var AMBIENTE_WS = "";

var PDF = "";

var transaccionId = "";
var cuitId = "";
var puntoDeVentaIdWS = "";
var codDoc = "";
var nroCbte = "";
var SesionId = "";
var FechaVencimiento = "";
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */




function lmryImprimirFactElectronicaSTLT(request, response){


	transaccionId = request.getParameter('tranid');
	var internalid = request.getParameter('namerdid');

	
	var serie = request.getParameter('ptoVenta');
		puntoDeVentaIdWS = nlapiLookupField('customrecord_lmry_pe_pto_vta_ws',serie,'custrecord_lmry_pe_pto_vta');
			/*
			serie = serie.substring(1,serie.length);
			if (serie == '001') {
				puntoDeVentaIdWS = '1000';
            }else if (serie == '002') {
            	puntoDeVentaIdWS = '1002';
            }else if (serie == '003') {
            	puntoDeVentaIdWS = '1000';
			}
			*/
	
	codDoc = request.getParameter('codDoc');
	nroCbte = request.getParameter('nroCbte');

	var featuresubs = nlapiGetContext().getFeature('SUBSIDIARIES'); 

	if (featuresubs == true) {
		var subsi = nlapiLookupField('invoice',internalid,'subsidiary');		
		cuitId = nlapiLookupField('subsidiary',subsi,'taxidnum');

	}else{
		var companyInfo = nlapiLoadConfiguration('companyinformation'); //Load company information
	 cuitId = companyInfo.getFieldValue('employerid');
		
	}


	getEnableFeatures();	
	var returnIniSesion	= WSIniSesion();
	var returnDescargarPdf = WSDescargarPdf();

	var File = nlapiCreateFile('Transaccion'+transaccionId+'.pdf', 'PDF', PDF);

	response.setContentType('PDF','Transaccion'+transaccionId+'.pdf','inline');
	response.write( PDF );
	
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
	
	/*	
		var objIniSesion = '';
    if (AMBIENTE_WS == '1') {
        require(['N/http'], function(http) {
            objIniSesion    =
                http.post({
                    url: URL_WS,
                    body: StringXML,
                    headers: soapHeaders
                });
        });
    }else if(AMBIENTE_WS == '2'){
        require(['N/https'], function(https) {
            objIniSesion    =
                https.post({
                    url: URL_WS,
                    body: StringXML,
                    headers: soapHeaders
                });
        });
    }  
	*/
	
    var objIniSesion=nlapiRequestURL(URL_WS,StringXML,soapHeaders);
	var returnIniSesion = objIniSesion.getBody();

	var sesion = returnIniSesion.split('SesionId')[1];
	
	if(sesion != null && sesion != ''){
		SesionId = sesion.substring(1, sesion.length-2);
		
		FechaVencimiento = returnIniSesion.split('FechaVencimiento')[1];
		
		FechaVencimiento = FechaVencimiento.substring(1, FechaVencimiento.length-22);
		
	}

	return returnIniSesion;
}

function WSDescargarPdf(){

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		'  <soap:Body>'+
		'    <DescargarPdf xmlns="http://comfiar.com.ar/webservice/">'+
		'      <transaccionId>'+transaccionId+'</transaccionId>'+
		'      <cuitId>'+cuitId+'</cuitId>'+
		'      <puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
		'      <tipoComprobanteId>'+codDoc+'</tipoComprobanteId>'+
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
		    
/*	var returnDescargarPdf = '';
    if (AMBIENTE_WS == '1') {
        require(['N/http'], function(http) {
            returnDescargarPdf    =   
                http.post({
                    url: URL_WS,
                    body: StringXML,
                    headers: soapHeaders
                });
        });
    }else if(AMBIENTE_WS == '2'){
        require(['N/https'], function(https) {
            returnDescargarPdf    =   
                https.post({
                    url: URL_WS,
                    body: StringXML,
                    headers: soapHeaders
                });
        });
    }
*/
var returnDescargarPdf = nlapiRequestURL(URL_WS,StringXML,soapHeaders);
returnDescargarPdf=returnDescargarPdf.getBody();

	var DescargarPdfResult = returnDescargarPdf.split('DescargarPdfResult')[1];
	
	if(DescargarPdfResult != null && DescargarPdfResult != ''){
		PDF = DescargarPdfResult.substring(1, DescargarPdfResult.length-2);
		
	}

	return returnDescargarPdf;
}

function getEnableFeatures(){

        // Registro Personalizado LatamReady - PE FEL Enable Feature

	var coltabla 	= new Array();
		coltabla[0] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_usuario_ws');
		coltabla[1] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_password_ws');
		coltabla[2] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_url_acceso_ws');
		coltabla[3] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_host_ws');
		coltabla[4] =  new nlobjSearchColumn('custrecord_lmry_pe_formatoid_ws');
		coltabla[5] =  new nlobjSearchColumn('custrecord_lmry_pe_ubigeo');
		coltabla[6] =  new nlobjSearchColumn('custrecord_lmry_pe_ambiente_ws');
		coltabla[7] =  new nlobjSearchColumn('custrecord_lmry_pe_fel_detra');
		coltabla[8] =  new nlobjSearchColumn('custrecord_lmry_pe_codigo_detra');
		coltabla[9] =  new nlobjSearchColumn('custrecord_lmry_pe_num_banco');
		

	var enabFeatureRecord = nlapiSearchRecord('customrecord_lmry_pe_fel_enable_feature'
		  , null
		  , null
		  , coltabla
		);

	if (enabFeatureRecord != '' && enabFeatureRecord != null) {
		USER = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_usuario_ws');
		PASSWORD  = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_password_ws');
		URL_WS  = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_url_acceso_ws');
		HOST_WS  = enabFeatureRecord[0].getValue('custrecord_lmry_pe_fel_host_ws');
		FORMATO_WS 	 = enabFeatureRecord[0].getValue('custrecord_lmry_pe_formatoid_ws');
		UBIGEO = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ubigeo');
		AMBIENTE_WS	 = enabFeatureRecord[0].getValue('custrecord_lmry_pe_ambiente_ws');
	}
}
