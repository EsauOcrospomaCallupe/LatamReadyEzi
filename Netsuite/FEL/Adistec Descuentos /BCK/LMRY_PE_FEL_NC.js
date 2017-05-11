/**
 * @NApiVersion 2.x
 * @NModuleScope Public 
 */

define(["N/record", "N/runtime", "N/file", "N/email", "N/encode", "N/search", "N/format"], 
	function(record, runtime, file, email, encode, search, format) {
	
/*		
	var URL_WS           = 'http://test.comfiar.com.pe/WS/';
	var USER             = 'WSLatamready';
	var PASSWORD         = 'Dqk8186878';
*/	

	var URL_WS      = '';
	var USER        = '';
	var PASSWORD    = '';
	var HOST_WS     = '';
	var AMBIENTE_WS = '';

	var SesionId         = '';
	var FechaVencimiento = '';
	var cuitId           = '';
	//var puntoDeVentaId   = '';
	var puntoDeVentaId   = '';
	var puntoDeVentaIdWS = '';
	var nroCbte          = '';
	//var codDoc           = '';
	var codDoc           = '';
	var TransaccionId    = '';
	var PDF              = '';
	//var internalId       = '204593';
	var internalId       = '';
	var exito            = false;
	var estab            = '';
	var ptoEmi           = '';
	var numAut 			 = '';
	var secuencial 		 = '';
	var tranID 			 = '';

	var estado_comfiar   = '';

	function send(plugInContext) {	

		var result = {
			success: true,
			message: "Success!"
		};
		try {

			getEnableFeatures();
			
			var returnIniSesion	= WSIniSesion();

			var rec = record.load({
					type: record.Type.CREDIT_MEMO,
					//id: plugInContext.tranId,
					id: plugInContext.transaction.id
					//id: internalId
				});

			internalId = plugInContext.transaction.id;
			tranID     = plugInContext.transaction.number;
			//nroCbte    = rec.getValue('custbody_lmry_num_preimpreso');

			var xmlEnvio = plugInContext.eInvoiceContent;
                               xmlEnvio = xmlEnvio.replace(/<br\s*[\/]?>/gi, " ");

			var codDocTemp='';
			codDoc = xmlEnvio.split('-TIPODOC-')[1];
			if(codDoc != null && codDoc != ''){
				codDocTemp = codDoc;
				//codDoc = codDoc.substring(0, codDoc.length-2);
				codDocTemp = '-TIPODOC-'+ codDocTemp +'-TIPODOC-';
				xmlEnvio = xmlEnvio.replace(codDocTemp,'');
			}

			cuitId = xmlEnvio.split('cbc:CustomerAssignedAccountID>')[1];
			cuitId = parseInt(cuitId);

			var numeracion = xmlEnvio.split('-NUMERACION-')[1];
			if(numeracion != null && numeracion != ''){
				puntoDeVentaId = numeracion.split('-')[0];
			}

			var serie;
			serie = puntoDeVentaId.substring(1,4);
			if (serie == '001') {
				puntoDeVentaIdWS = '1';
			}else if (serie == '002') {
				puntoDeVentaIdWS = '1000';
			}else if (serie == '003') {
				puntoDeVentaIdWS = '1001';
			}

			var fechaEmision = xmlEnvio.split('cbc:IssueDate>')[1];			
			if(fechaEmision != null && fechaEmision != ''){
				fechaEmision = fechaEmision.substring(0, fechaEmision.length-2);
				fecha_temp 	 = fechaEmision;
				fechaEmision = FormatoDDMMYYY(fechaEmision);
				xmlEnvio = xmlEnvio.replace(fecha_temp, fechaEmision);
			}

			//Asigna correlativo y nroCbte
			var returnUltimoNroCbte = WSUltimoNroCbte();

			var numeracion_last = '-NUMERACION-' + numeracion + '-NUMERACION-';
			var numeracion_new  = puntoDeVentaId + '-' + secuencial;
			xmlEnvio = xmlEnvio.replace(numeracion_last, numeracion_new);

			/*Generacion Tax Code"*/
			var COD  = xmlEnvio.split('-COD-');
			for (var j = 1; j < COD.length; j=j+2) {

				if(COD[j] != null && COD[j] != ''){
					if(COD[j] == 'VAT_PE:S-PE'){
						reg = new RegExp('-COD-VAT_PE:S-PE-COD-', "g");
						xmlEnvio = xmlEnvio.replace(reg, '10');				
					}
					if(COD[j] == 'VAT_PE:E-PE'){
						reg = new RegExp('-COD-VAT_PE:E-PE-COD-', "g");
						xmlEnvio = xmlEnvio.replace(reg, '20');				
					}
					if(COD[j] == 'VAT_PE:X-PE'){
						reg = new RegExp('-COD-VAT_PE:X-PE-COD-', "g");
						xmlEnvio = xmlEnvio.replace(reg, '40');				
					}			
				}
			}

			/*Generacion Sumatorias Montos por Impuesto*/
			/*Para MONTOLINEA : "Total valor de venta - operaciones gravadas" - Cod 10 "Gravado - Operación Onerosa". */
			var monto_1001 = 0;
			/*Para MONTOLINEA : "Total valor de venta - operaciones inafectas" - Cod 40 "Exportación". */ 
			var monto_1002 = 0; 
			/*Para MONTOLINEA : "Total valor de venta - operaciones exoneradas" - Cod 20 "Exonerado - "Operación Onerosa". */
			var monto_1003 = 0; 
			var MONTOLINEA = 0;
			var InvoiceLine  = xmlEnvio.split('cac:CreditNoteLine');
			for (var j = 1; j < InvoiceLine.length; j=j+2) {

				if(InvoiceLine[j] != null && InvoiceLine[j] != ''){
					InvoiceLine_temp = InvoiceLine[j];

					var CodTipoAfecto = InvoiceLine_temp.split('cbc:TaxExemptionReasonCode>')[1];			
					if(CodTipoAfecto != null && CodTipoAfecto != ''){
						CodTipoAfecto = CodTipoAfecto.substring(0, CodTipoAfecto.length-2);
						MONTOLINEA    = parseFloat(InvoiceLine_temp.split('-MONTOLINEA-')[1]).toFixed(2);
						if (CodTipoAfecto == '10') {
							monto_1001    = monto_1001 + parseFloat(MONTOLINEA);
						}else if (CodTipoAfecto == '40') {
							monto_1002    = monto_1002 + parseFloat(MONTOLINEA);
						}
						else if (CodTipoAfecto == '20') {
							monto_1003    = monto_1003 + parseFloat(MONTOLINEA);
						}
					}
				}
			}
			/* Se reemplaza Totales de venta segun Tipo de IGV */
			xmlEnvio = xmlEnvio.replace('-MONTO1001-', monto_1001);
			xmlEnvio = xmlEnvio.replace('-MONTO1002-', monto_1002);
			xmlEnvio = xmlEnvio.replace('-MONTO1003-', monto_1003);
			reg = new RegExp('-MONTOLINEA-', "g");
			xmlEnvio = xmlEnvio.replace(reg, '');	


			var returnAutCbtsAsinc	= WSAutCbtsAsinc(xmlEnvio);

			/* Tiempo de espera de respuesta de SUNAT */
			sleep(1500);
			
			
			var returnSalidaTransac = '';
			if(TransaccionId != ''){
				returnSalidaTransac = WSSalidaTransac();
			}
			
			var returnRespCbte = WSRespCbte();

			if (exito) {
				//rec.setValue('custbody_lmry_pe_identificador_comfiar', TransaccionId);
				rec.setValue('custbody_lmry_pe_identificador_comfiar', TransaccionId);
	            rec.setValue('custbody_lmry_pe_num_aut_comfiar', numAut);
	            rec.setValue('custbody_lmry_num_preimpreso', secuencial);
                rec.setValue('custbody_lmry_pe_estado_comfiar', estado_comfiar);	            
	            rec.save();
	        
	        	var returnDescargarPdf = WSDescargarPdf();
        	}else{
                result.success = false;
                result.message = "Failure";
                //result.message = e.valueOf().toString();
            }

			//sendMail(xmlEnvio, returnIniSesion, returnUltimoNroCbte, returnAutCbtsSinc, returnSalidaTransac, returnRespCbte, returnDescargarPdf, PDF);
			sendMail(xmlEnvio, returnIniSesion, returnUltimoNroCbte, returnAutCbtsAsinc, returnSalidaTransac, returnRespCbte, returnDescargarPdf, PDF);

		} catch (e) {
			result.success = false;
			result.message = e.valueOf().toString();
			var logRecord = record.create({type: 'customrecord_lmry_pe_fel_lote_envio'});
				logRecord.setValue('custrecord_lmry_pe_envio_subsi', runtime.getCurrentUser().subsidiary);
				logRecord.setValue('custrecord_lmry_pe_envio_user', runtime.getCurrentUser().id);
				logRecord.setValue('custrecord_lmry_pe_envio_transac', internalId);
				//logRecord.setValue('custrecord_lmry_pe_envio_status', '');
				logRecord.setValue('custrecord_lmry_pe_envio_status', e.valueOf().toString().substring(0,300));
				logRecord.setValue('custrecord_lmry_pe_envio_resp', "");
				logRecord.setValue('custrecord_lmry_pe_envio_iden', codDoc);
				logRecord.save();
		}

		return result;
		
	};

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

	function WSAutCbtsAsinc(xml){
		
		var StringXML = 
	        '<?xml version="1.0" encoding="utf-8"?>'+
			'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
			'<soap:Body>'+
			    '<AutorizarComprobantesAsincronico xmlns="http://comfiar.com.ar/webservice/">'+
			      '<XML><![CDATA['+xml+']]></XML>'+
			      '<cuitAProcesar>'+cuitId+'</cuitAProcesar>'+
			      '<puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
			      '<tipoDeComprobanteId>'+codDoc+'</tipoDeComprobanteId>'+
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
  		
  		var objAutCbtsAsinc = '';
		if (AMBIENTE_WS == '1') {
            require(['N/http'], function(http) {
                objAutCbtsAsinc    =   
                    http.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }else if(AMBIENTE_WS == '2'){
            require(['N/https'], function(https) {
                objAutCbtsAsinc    =   
                    https.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }

		var returnAutCbtsAsinc = objAutCbtsAsinc.body;
	   		returnAutCbtsAsinc = replaceXML(returnAutCbtsAsinc);
	    
	    
	    //var AutCbtsAsincResult = returnAutCbtsAsinc.split('AutorizarComprobantesAsincronicoResult')[1];
	    var SalidaTransaccion = returnAutCbtsAsinc.split('SalidaTransaccion')[1];
		if(SalidaTransaccion != null && SalidaTransaccion != ''){
			var TransacId = SalidaTransaccion.split('ID')[1];
			if(TransacId != null && TransacId != ''){
				TransaccionId = TransacId.substring(1, TransacId.length-2);
			}
		}
		
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
			      '<puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
			      '<tipoDeComprobanteId>'+codDoc+'</tipoDeComprobanteId>'+
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
  		    
		var objAutCbtsSinc = '';
        if (AMBIENTE_WS == '1') {
            require(['N/http'], function(http) {
                objAutCbtsSinc    =   
                    http.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }else if(AMBIENTE_WS == '2'){
            require(['N/https'], function(https) {
                objAutCbtsSinc    =   
                    https.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }

		var returnAutCbtsSinc = objAutCbtsSinc.body;
	   		returnAutCbtsSinc = replaceXML(returnAutCbtsSinc);
	    
	    
	    //var AutCbtsAsincResult = returnAutCbtsAsinc.split('AutorizarComprobantesAsincronicoResult')[1];
	    var SalidaTransaccion2 = returnAutCbtsSinc.split('TransaccionId')[1];
		if(SalidaTransaccion2 != null && SalidaTransaccion2 != ''){
			
				TransaccionId = SalidaTransaccion2.substring(1, SalidaTransaccion2.length-2);
			
		}

	    var SalidaTransaccion = returnAutCbtsSinc.split('Transaccion')[1];
		if(SalidaTransaccion != null && SalidaTransaccion != ''){
			var TransacId = SalidaTransaccion.split('ID')[1];
			if(TransacId != null && TransacId != ''){
				TransaccionId = TransacId.substring(1, TransacId.length-2);
			}
		}
		
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
  		    
		var objSalidaTransac = '';
        if (AMBIENTE_WS == '1') {
            require(['N/http'], function(http) {
                objSalidaTransac    =   
                    http.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }else if(AMBIENTE_WS == '2'){
            require(['N/https'], function(https) {
                objSalidaTransac    =   
                    https.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }

		var returnSalidaTransac	= objSalidaTransac.body;
			returnSalidaTransac = replaceXML(returnSalidaTransac);

		var estado = returnSalidaTransac.split('Estado>')[1];
		var error = returnSalidaTransac.split('Error>')[2];
		if(estado != null && estado != ''){	
				
			estado = estado.substring(0, estado.length-2);
			if (estado == 'ACEPTADO' || estado == 'AUTORIZADO') {
				exito = true;
				estado_comfiar = estado;

				//MENSAJE DE EXITO
				var logRecord = record.create({type: 'customrecord_lmry_pe_fel_lote_envio'});
					logRecord.setValue('custrecord_lmry_pe_envio_subsi', runtime.getCurrentUser().subsidiary);
					logRecord.setValue('custrecord_lmry_pe_envio_user', runtime.getCurrentUser().id);
					logRecord.setValue('custrecord_lmry_pe_envio_transac', internalId);
					logRecord.setValue('custrecord_lmry_pe_envio_status', estado + " - puntoDeVentaIdWS: " + puntoDeVentaIdWS);
					logRecord.setValue('custrecord_lmry_pe_envio_resp', "Transaccion ID: " + TransaccionId);
					logRecord.setValue('custrecord_lmry_pe_envio_iden', codDoc);
					logRecord.save();
			}else{
				/*
				var arrayMensaje = returnSalidaTransac.split('mensaje>');
				var mensajeError = 'Errores Encontrados: \n';	
				for (var i = 2; i < arrayMensaje.length; i=i+4) {
					var mensaje = arrayMensaje[i].substring(0, arrayMensaje[i].length-2);
					mensajeError += mensaje + '\n';
				}
				mensajeError = mensajeError.substring(0, 300);*/
				var mensajeError = returnSalidaTransac.split('mensaje>')[2];
				if (mensajeError != null && mensajeError != '') {
					mensajeError = mensajeError.substring(0, mensajeError.length-2);
				}else{
					mensajeError = 'ERROR..';
				}
				//SE GUARDA MENSAJE ERROR
				var logRecord = record.create({type: 'customrecord_lmry_pe_fel_lote_envio'});
					logRecord.setValue('custrecord_lmry_pe_envio_subsi', runtime.getCurrentUser().subsidiary);
					logRecord.setValue('custrecord_lmry_pe_envio_user', runtime.getCurrentUser().id);
					logRecord.setValue('custrecord_lmry_pe_envio_transac', internalId);
					logRecord.setValue('custrecord_lmry_pe_envio_status', "RECHAZADO" + " - puntoDeVentaIdWS: " + puntoDeVentaIdWS);
					logRecord.setValue('custrecord_lmry_pe_envio_resp', mensajeError);
					//logRecord.setValue('custrecord_lmry_pe_envio_resp', 'ERROR..');
					logRecord.setValue('custrecord_lmry_pe_envio_iden', codDoc);
					logRecord.save();			
			}
		}else if (error != null && error != '') {
			error = error.substring(0, error.length-2);
			var logRecord = record.create({type: 'customrecord_lmry_pe_fel_lote_envio'});
				logRecord.setValue('custrecord_lmry_pe_envio_subsi', runtime.getCurrentUser().subsidiary);
				logRecord.setValue('custrecord_lmry_pe_envio_user', runtime.getCurrentUser().id);
				logRecord.setValue('custrecord_lmry_pe_envio_transac', internalId);
				logRecord.setValue('custrecord_lmry_pe_envio_status', "RECHAZADO" + " - puntoDeVentaIdWS: " + puntoDeVentaIdWS);
				//logRecord.setValue('custrecord_lmry_pe_envio_resp', mensajeError);
				logRecord.setValue('custrecord_lmry_pe_envio_resp', error);
				logRecord.setValue('custrecord_lmry_pe_envio_iden', codDoc);
				logRecord.save();
		}

		return returnSalidaTransac;
	}

	function WSRespCbte(){

		var StringXML = 
	        '<?xml version="1.0" encoding="utf-8"?>'+
			'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
			  '<soap:Body>'+
			    '<RespuestaComprobante xmlns="http://comfiar.com.ar/webservice/">'+
			      '<cuitId>'+cuitId+'</cuitId>'+
			      '<puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
			      '<tipoDeComprobanteId>'+codDoc+'</tipoDeComprobanteId>'+
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
  		    
		var objRespCbte = '';
        if (AMBIENTE_WS == '1') {
            require(['N/http'], function(http) {
                objRespCbte    =   
                    http.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }else if(AMBIENTE_WS == '2'){
            require(['N/https'], function(https) {
                objRespCbte    =   
                    https.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }

		var returnRespCbte = objRespCbte.body;
			returnRespCbte = replaceXML(returnRespCbte);

		return returnRespCbte;
	}

	function WSUltimoNroCbte(){

		var StringXML = 
	        '<?xml version="1.0" encoding="utf-8"?>'+
			'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
			'  <soap:Body>'+
			'    <UltimoNumeroComprobante xmlns="http://comfiar.com.ar/webservice/">'+
			'      <cuitId>'+cuitId+'</cuitId>'+
			'      <puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
			'      <tipoDeComprobanteId>'+codDoc+'</tipoDeComprobanteId>'+
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
			
		var returnUltimoNroCbte = '';
        if (AMBIENTE_WS == '1') {
            require(['N/http'], function(http) {
                returnUltimoNroCbte    =   
                    http.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }else if(AMBIENTE_WS == '2'){
            require(['N/https'], function(https) {
                returnUltimoNroCbte    =   
                    https.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }

		var UltimoNroCbteResult = returnUltimoNroCbte.body.split('UltimoNumeroComprobanteResult')[1];
		if(UltimoNroCbteResult != null && UltimoNroCbteResult != ''){	

			secuencial = UltimoNroCbteResult.substring(1, UltimoNroCbteResult.length-2);
			secuencial++;

			secuencial = "" + secuencial;
			var pad = "00000000";
				secuencial = pad.substring(0, pad.length - secuencial.length) + secuencial;
				nroCbte = secuencial;
		}

		return returnUltimoNroCbte.body;
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

	function WSDescargarXML(){

		var StringXML = 
	        '<?xml version="1.0" encoding="utf-8"?>'+
			'<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'+
			  '<soap:Body>'+
			    '<DescargarXml xmlns="http://comfiar.com.ar/webservice/">'+
			      '<transaccionId>'+TransaccionId+'</transaccionId>'+
			      '<cuitId>'+cuitId+'</cuitId>'+
			      '<puntoDeVentaId>'+puntoDeVentaIdWS+'</puntoDeVentaId>'+
			      '<tipoComprobanteId>'+codDoc+'</tipoComprobanteId>'+
			      '<numeroComprobante>'+nroCbte+'</numeroComprobante>'+
			      '<token>'+
			        '<SesionId>'+SesionId+'</SesionId>'+
			        '<FechaVencimiento>'+FechaVencimiento+'</FechaVencimiento>'+
			      '</token>'+
			    '</DescargarXml>'+
			  '</soap:Body>'+
			'</soap:Envelope>'; 

		var soapHeaders = new Array(); 
			soapHeaders['Host'] = HOST_WS;
			soapHeaders['Content-Type'] = 'text/xml; charset=utf-8'; 
			soapHeaders['Content-Length'] = 'length';
			soapHeaders['SOAPAction'] = "http://comfiar.com.ar/webservice/DescargarXml";
  		    
		var returnDescargarXML = '';
        if (AMBIENTE_WS == '1') {
            require(['N/http'], function(http) {
                returnDescargarXML    =   
                    http.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }else if(AMBIENTE_WS == '2'){
            require(['N/https'], function(https) {
                returnDescargarXML    =   
                    https.post({
                        url: URL_WS,
                        body: StringXML,
                        headers: soapHeaders
                    });
            });
        }  
		
		var DescargarXmlResult = returnDescargarXML.body.split('DescargarXmlResult')[1];
		if(DescargarXmlResult != null && DescargarXmlResult != ''){
			XML = DescargarXmlResult.substring(1, DescargarXmlResult.length-2);
		}

		return returnDescargarXML.body;
	}

	function sendMail(content, WSIniSesion, WSUltimoNroCbte, WSAutCbtsSinc, WSSalidaTransac, WSRespCbte, WSDescargarPdf, PDF){

		var currentuser = runtime.getCurrentUser().id;
		var emailUser   = runtime.getCurrentUser().email;

		var recEmp = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: currentuser,
            columns: 'firstname'
        });
        var nameUser    = recEmp.firstname;
		
		var today = new Date();
		//today = nlapiDateToString(today, 'datetime');
				
		var body =  '<table style="border:lightgrey 15px solid;" width="750">';
            body += '<td style="padding-left:13pt; padding-right:13pt; padding-bottom:13pt; color:#585858; font-size:15px;">';
            body += '<img src="https://system.na1.netsuite.com/core/media/media.nl?id=370&c=TSTDRV1038915&h=4b1ae4e745fe6134cb15" width="300" height="150" />';
            body += '<hr>';
            body += '<p><span style="color:#01A9DB; font-size:16px;"><b>Estimado cliente ' + nameUser + ':</b></span></p>';
            body += '<hr>';
            body += '<p style="padding-bottom:12px;">Este es un mensaje desde NetSuite LatamReady. </p>';

		
			body += '<p>Se ha generado la Nota de Credito Electrónica ' + tranID + ' con Internal ID ' + internalId + '.</p>';
		
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
		//var FileName = 'Archivo Facturacion Electronica ' + today +'.CSV';

		var i = 0;
		var FileName = 'Archivo Facturacion Electronica PE.ftl';

		if(content != null && content != ''){
			fileXML[0] = file.create({
						    name    : FileName,
						    fileType: file.Type.FREEMARKER,
						    contents: content
				    	});
			i++;
		}
		if(WSIniSesion != null && WSIniSesion != ''){
			fileXML[i] = file.create({
						    name    : "Response IniciarSesion.xml",
						    fileType: file.Type.XMLDOC,
						    contents: WSIniSesion
				    	});
			i++;
		}
		if(WSUltimoNroCbte != null && WSUltimoNroCbte != ''){
			fileXML[i] = file.create({
						    name    : "Response UltimoNroCbte.xml",
						    fileType: file.Type.XMLDOC,
						    contents: WSUltimoNroCbte
				    	});
			i++;
		}		
		if(WSAutCbtsSinc != null && WSAutCbtsSinc != ''){
			fileXML[i] = file.create({
					    name    : "Response AutorizarComprobantesSincronico.xml",
					    fileType: file.Type.XMLDOC,
					    contents: WSAutCbtsSinc
			    	});
			i++;
		}
		if(WSSalidaTransac != null && WSSalidaTransac != ''){
			fileXML[i] = file.create({
					    name    : "Response Salida Transaccion.xml",
					    fileType: file.Type.XMLDOC,
					    contents: WSSalidaTransac
			    	});
			i++;
		}
		if(WSRespCbte != null && WSRespCbte != ''){
			fileXML[i] = file.create({
						    name    : "Response RespuestaComprobante.xml",
						    fileType: file.Type.XMLDOC,
						    contents: WSRespCbte
				    	});
			i++;
		}
		if(WSDescargarPdf != null && WSDescargarPdf != ''){
			fileXML[i] = file.create({
						    name    : "Response DescargarPdf.xml",
						    fileType: file.Type.XMLDOC,
						    contents: WSDescargarPdf
				    	});
			i++;
		}
		if(PDF != null && PDF != ''){
			fileXML[i] = file.create({
						    name    : "Response PDF.pdf",
						    fileType: file.Type.PDF,
						    contents: PDF
				    	});
			i++;
		}					
			//fileXML[0].save();

		var subject = "LatamReady - Nota de Crédito Electrónica PE: " + tranID;

		//'manuel@latamready.com'
		email.send({
            author: currentuser,
            recipients: emailUser,
            subject: subject,
            body: body,
            attachments: fileXML
        });
	}	

	function replaceXML(xml){
		xml = xml.replace(/&lt;/g, '<');
	    xml = xml.replace(/&gt;/g, '>');
	    xml = xml.replace(/&amp;lt;/g, '<');
	    xml = xml.replace(/&amp;gt;/g, '>');

	    return xml;
	}

	function retornaValorFecha(valor){
		valor = valor+'';
		if(valor.substr(1,1)=='-'){
			valor = '0'+valor;
		}
		if(valor.substr(4,1)=='-'){
			valor = valor.split('-')[0]+'-'+valor.split('-')[1]+'-'+valor.split('-')[2];
		}
		//valor = fechaDiaMesAnio(valor);
		return valor;
	}

	function FormatoDDMMYYY(fecha){
		//var f = nlapiStringToDate(fecha);
		var f = format.parse({
		    value: fecha,
		    type: format.Type.DATE
		});
		var d = f.getDate();
		var m = f.getMonth()+1;
		var y = f.getFullYear();
		m = m+'';
		d = d+'';
		if(m.length==1){
			m='0'+m;
		}
		if(d.length==1){
			d='0'+d;
		}
		var fechaOrden = y+'-'+m+'-'+d;
			//fechaOrden = retornaValorFecha(fechaOrden);
		return fechaOrden;
	}

	function getEnableFeatures(){

		// Registro Personalizado LatamReady - PE Enable Feature FEL
        
        busqEnabFet = search.create({
            type: 'customrecord_lmry_pe_fel_enable_feature',
            columns: ['custrecord_lmry_pe_fel_usuario_ws', 'custrecord_lmry_pe_fel_password_ws', 
                        'custrecord_lmry_pe_fel_url_acceso_ws', 'custrecord_lmry_pe_fel_host_ws',
                        'custrecord_lmry_pe_formatoid_ws', 'custrecord_lmry_pe_ambiente_ws']
        });
        resultEnabFet = busqEnabFet.run().getRange(0, 10);
        
        if(resultEnabFet != null && resultEnabFet.length != 0){
            row  = resultEnabFet[0].columns;
            USER        = resultEnabFet[0].getValue(row[0]);
            PASSWORD    = resultEnabFet[0].getValue(row[1]);
            URL_WS      = resultEnabFet[0].getValue(row[2]);
            HOST_WS     = resultEnabFet[0].getValue(row[3]);
            FORMATO_WS  = resultEnabFet[0].getValue(row[4]);
			AMBIENTE_WS = resultEnabFet[0].getValue(row[5]);
        }      
	}	
	
	function sleep(milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	}

	return{
		send: send
	};
});