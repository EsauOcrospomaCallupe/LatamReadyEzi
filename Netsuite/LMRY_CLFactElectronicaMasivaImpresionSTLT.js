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


var subsidiaria = '';

function lmryImprimirFactElectronicaSTLT(request, response){


	subsidiaria = request.getParameter('subsi');
	getEnableFeatures();
	var url = nlapiResolveURL('SUITELET', 'customscript_lmry_get_country_stlt', 'customdeploy_lmry_get_country_stlt') + '&sub=' + subsidiari;

	
	var returnIniSesion	= WSIniSesion();

	var serie;
			serie = request.getParameter('serie');
			if (serie == '001') {
				puntoDeVentaIdWS = '1000';
            }else if (serie == '002') {
            	puntoDeVentaIdWS = '1001';
            }else if (serie == '003') {
            	puntoDeVentaIdWS = '1000';
			}
	//var recFolio = request.getParameter('folio');
	//nlapiLogExecution('ERROR', 'FOLIO INGRESADO', recFolio);
	var returnDescargarPdf = WSDescargarPdf();
	var PDFdes ="";
	PDFdes = file.create({
						    name    : "Response PDF.pdf",
						    fileType: file.Type.PDF,
						    contents: PDF
				    	});

	var token = tokenObtenido();
	var returnEnvio3 = nlapiRequestURL(URLEnvioArchivo,xmlEnvioConsultaPDF(token, recFolio),soapHeadersPDF);
	
	var valorRetornoEnvio3 	= returnEnvio3.getBody();
	var arrayRetornoenvio3 	= valorRetornoEnvio3.split('ObtenerPDFResult');
	nlapiLogExecution('ERROR', 'RETORNO PDF', valorRetornoEnvio3);
	nlapiLogExecution('ERROR', 'arrayRetornoenvio3[1]', arrayRetornoenvio3[1]);
	var valorByte24PDF 	= '';
	
	if(arrayRetornoenvio3[1]!=null){
		valorByte24PDF 	= arrayRetornoenvio3[1];
		valorByte24PDF	= valorByte24PDF.substr(1);
		valorByte24PDF 	= valorByte24PDF.substr(0,valorByte24PDF.length-2);
	}
	if(valorByte24PDF==''){
		nlapiLogExecution('ERROR', 'valorByte24PDF = ?', valorByte24PDF);
	}else{
		nlapiLogExecution('ERROR', 'valorByte24PDF', valorByte24PDF);
		//var File = nlapiCreateFile('Folio'+recFolio, 'PDF', valorByte24PDF);
		response.setContentType('PDF','Folio'+recFolio+'.pdf','inline');
		response.write( valorByte24PDF );
	}
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
	
	var returnIniSesion = objIniSesion.body;
		returnIniSesion = replaceXML(returnIniSesion);

	var sesion = returnIniSesion.split('SesionId')[1];
	if(sesion != null && sesion != ''){
		SesionId = sesion.substring(1, sesion.length-2);
		FechaVencimiento = returnIniSesion.split('FechaVencimiento')[1];
		FechaVencimiento = FechaVencimiento.substring(1, FechaVencimiento.length-2);
	}

	return returnIniSesion;
}

function WSDescargarPdf(){

	var StringXML = 
        '<?xml version="1.0" encoding="utf-8"?>'+
		'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
		'  <soap:Body>'+
		'    <DescargarPdf xmlns="http://comfiar.com.ar/webservice/">'+
		'      <transaccionId>'+TransaccionId+'</transaccionId>'+
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
		    
	var returnDescargarPdf = '';
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

	var DescargarPdfResult = returnDescargarPdf.body.split('DescargarPdfResult')[1];
	if(DescargarPdfResult != null && DescargarPdfResult != ''){
		PDF = DescargarPdfResult.substring(1, DescargarPdfResult.length-2);
	}

	return returnDescargarPdf.body;
}

function getEnableFeatures(){

        // Registro Personalizado LatamReady - PE Enable Feature FEL
        
        busqEnabFet = search.create({
            type: 'customrecord_lmry_pe_fel_enable_feature',
            columns: ['custrecord_lmry_pe_fel_usuario_ws', 'custrecord_lmry_pe_fel_password_ws', 
                        'custrecord_lmry_pe_fel_url_acceso_ws', 'custrecord_lmry_pe_fel_host_ws',
                        'custrecord_lmry_pe_formatoid_ws', 'custrecord_lmry_pe_ubigeo',
                        'custrecord_lmry_pe_ambiente_ws','custrecord_lmry_pe_fel_detra',
                        'custrecord_lmry_pe_codigo_detra','custrecord_lmry_pe_num_banco']
        });
        resultEnabFet = busqEnabFet.run().getRange(0, 10);
        
        if(resultEnabFet != null && resultEnabFet.length != 0){
            row  = resultEnabFet[0].columns;
			USER        = resultEnabFet[0].getValue(row[0]);
			PASSWORD    = resultEnabFet[0].getValue(row[1]);
			URL_WS      = resultEnabFet[0].getValue(row[2]);
			HOST_WS     = resultEnabFet[0].getValue(row[3]);
			FORMATO_WS  = resultEnabFet[0].getValue(row[4]);
			UBIGEO      = resultEnabFet[0].getValue(row[5]);
			AMBIENTE_WS = resultEnabFet[0].getValue(row[6]);
			DETRACCION  = resultEnabFet[0].getValue(row[7]);
			CODIGODETRA = resultEnabFet[0].getValue(row[8]);
			NUMCUENTA   = resultEnabFet[0].getValue(row[9]);
        }
    }
}