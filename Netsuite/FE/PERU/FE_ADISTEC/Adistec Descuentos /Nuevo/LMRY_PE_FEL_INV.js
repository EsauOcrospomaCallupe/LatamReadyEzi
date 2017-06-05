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
	var UBIGEO      = '';
	var HOST_WS     = '';
	var AMBIENTE_WS = '';
	var FORMATO_WS  = '';
	var DETRACCION  = '';
	var CODIGODETRA = '';
	var NUMCUENTA   = '';
	
	var SesionId         = '';
	var FechaVencimiento = '';
	var cuitId           = '';
	var puntoDeVentaIdWS = '';
	var puntoDeVentaId   = '';
	var nroCbte          = '';
	var codDoc           = '';
	var TransaccionId    = '';
	var PDF              = '';
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
					type: record.Type.INVOICE,
					id: plugInContext.transaction.id
				});

			internalId = plugInContext.transaction.id;
			tranID     = plugInContext.transaction.number;
			//nroCbte    = rec.getValue('custbody_lmry_num_preimpreso');

			var xmlEnvio = plugInContext.eInvoiceContent;
				xmlEnvio = xmlEnvio.replace(/<br\s*[\/]?>/gi, " ");
			
			cuitId = xmlEnvio.split('cbc:CustomerAssignedAccountID>')[1];
            if(cuitId != null && cuitId != ''){
                cuitId = cuitId.substring(0, cuitId.length-2);
            }

            /* Obtiene Tipo de Documento codDoc */
			codDoc = xmlEnvio.split('cbc:InvoiceTypeCode>')[1];
			if(codDoc != null && codDoc != ''){
				codDoc = codDoc.substring(0, codDoc.length-2);
			}
			/* Obtiene Tipo de Documento codDoc si es Nota de Debito */
			codDocDeb = xmlEnvio.split('-CODDOC-')[1];
			if(codDocDeb != null && codDocDeb != ''){
				codDoc = codDocDeb;
			}	

			/* Obtiene puntoDeVentaId */
			var numeracion = xmlEnvio.split('-NUMERACION-')[1];
			if(numeracion != null && numeracion != ''){
				puntoDeVentaId = numeracion.split('-')[0];
			}

			var serie;
			//serie = puntoDeVentaId.substring(1,4);
			//serie = puntoDeVentaId.substring(0,4);
			serie = puntoDeVentaId;

			/* Registro Personalizado LatamReady - PE Puntos Ventas WS
				var serie  = resultPtoVta[i].getValue(row[0]);
				var ptoVta = resultPtoVta[i].getValue(row[1]);
			*/
        
	        busqPtoVta = search.create({
	            type: 'customrecord_lmry_pe_pto_vta_ws',
	            columns: ['custrecord_lmry_pe_serie_cxc', 'custrecord_lmry_pe_pto_vta']
	        });
	        resultPtoVta = busqPtoVta.run().getRange(0, 30);
	        
	        if(resultPtoVta != null && resultPtoVta.length != 0){
	        	for (var i = 0; i < resultPtoVta.length; i++) {
	        		row  = resultPtoVta[i].columns;
	        		xmlEnvio = xmlEnvio.replace('*PTOVTA*', resultPtoVta[i].getValue(row[0]));
	        		xmlEnvio = xmlEnvio.replace('*PTOVTA1*', resultPtoVta[i].getText(row[0]));
	        		if (serie == resultPtoVta[i].getValue(row[0])) {
						puntoDeVentaIdWS = resultPtoVta[i].getValue(row[1]);
		            }
	        	}
	        }

			/* Asigna UBIGEO */
			xmlEnvio = xmlEnvio.replace('-UBIGEO-', UBIGEO);

			/* Se da formato a fecha de emisión */
			var IssueDate = xmlEnvio.split('cbc:IssueDate>')[1];
			if(IssueDate != null && IssueDate != ''){
				IssueDate      = IssueDate.substring(0, IssueDate.length-2);
				IssueDate_temp = IssueDate;
				IssueDate      = FormatoDDMMYYY(IssueDate);
				xmlEnvio       = xmlEnvio.replace(IssueDate_temp, IssueDate);
			}

			/* Asigna correlativo y nroCbte */
			var returnUltimoNroCbte = WSUltimoNroCbte();

			var numeracion_last = '-NUMERACION-' + numeracion + '-NUMERACION-';
			var numeracion_new  = puntoDeVentaId + '-' + secuencial;
			xmlEnvio = xmlEnvio.replace(numeracion_last, numeracion_new);

			/* 	Generacion Tax Code

				BUSQUEDA LatamReady - PE Tax Code View 
				TAX           = resultTaxCode[i].getValue(row[0]);
				NAME AFECTO   = resultTaxCode[i].getValue(row[1]);
				CODIGO AFECTO = resultTaxCode[i].getValue(row[2]);
			*/
            var busqTaxCode = search.load({
                    id : 'customsearch_lmry_pe_tax_code'
                });

            resultTaxCode = busqTaxCode.run().getRange(0, 100);
			var COD  = xmlEnvio.split('-COD-');
			var reg;
			for (var i = 0; i < resultTaxCode.length; i++){
                var row  = resultTaxCode[i].columns;
                for (var j = 1; j < COD.length; j=j+2) {
                	if(COD[j] != null && COD[j] != ''){
                		var cadenaCod = "-COD-" + resultTaxCode[i].getValue(row[0]) + "-COD-";
						if(COD[j] == resultTaxCode[i].getValue(row[0])){
							reg = new RegExp(cadenaCod, "g");
							xmlEnvio = xmlEnvio.replace(reg, resultTaxCode[i].getValue(row[2]));
						}
					}
                }
            }

            /***************************************************************************/

            var descCab = xmlEnvio.split('-MONTO2005-')[1];
            var dato ='';

            var desclast = '-MONTO2005-'+descCab+'-MONTO2005-';
            descCab=parseFloat(descCab);
            var descGlo = 0.00;
            var montoDescTot=0.00;
           

            
            	var InvoiceLine  = xmlEnvio.split('cac:InvoiceLine');
      
				for (var j = 1; j < InvoiceLine.length; j=j+2) {
					
					if(InvoiceLine[j] != null && InvoiceLine[j] != ''){
						
						var validador = xmlEnvio.split('-VALI-')[1];
            			var valiLast = '-VALI-'+validador+'-VALI-';
            			xmlEnvio = xmlEnvio.replace(valiLast,'');
						if(validador !=null && validador!=''){
							InvoiceLine_temp = InvoiceLine[j];
							var montoDesc = InvoiceLine_temp.split('-MONTODESC-')[1];
							if(montoDesc != null && montoDesc != ''){
								
								//montoDesc=montoDesc.toFixed(2);
								montoDesc= parseFloat(montoDesc);
								montoDescTot = montoDescTot + montoDesc;

							}
						}
					}	
				}
            
            descGlo= descCab+montoDescTot;
            xmlEnvio = xmlEnvio.replace(desclast,descGlo);
            reg = new RegExp('-MONTODESC-', "g");
			xmlEnvio = xmlEnvio.replace(reg, '');


            /***************************************************************************/
            /*Generacion Sumatorias Montos por Impuesto*/
			/*Para MONTOLINEA : "Total valor de venta - operaciones gravadas" - Cod 10 "Gravado - Operación Onerosa". */
			var monto_1001 = 0.00;
			/*Para MONTOLINEA : "Total valor de venta - operaciones inafectas" - Cod 40 "Exportación". */ 
			var monto_1002 = 0.00; 
			/*Para MONTOLINEA : "Total valor de venta - operaciones exoneradas" - Cod 20 "Exonerado - Operación Onerosa". */
			var monto_1003 = 0.00;
			/*Para MONTOLINEA : "Total valor de venta – Operaciones gratuitas"
				- Cod 31 "Inafecto – Retiro por Bonificación".
				- Cod 32 "Inafecto – Retiro". 
			*/
			var monto_1004 = 0.00; 
			var MONTOLINEA = 0.00;
			var InvoiceLine  = xmlEnvio.split('cac:InvoiceLine');
			if (codDoc == '08') {
				InvoiceLine  = xmlEnvio.split('cac:DebitNoteLine');
			}
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
						}else if (CodTipoAfecto == '20') {
							monto_1003    = monto_1003 + parseFloat(MONTOLINEA);
						}else if (CodTipoAfecto == '31' || CodTipoAfecto == '32') {
							monto_1004    = monto_1004 + parseFloat(MONTOLINEA);
							//var montolast='-MONTOLINEA-'+ MONTOLINEA + '-MONTOLINEA-';
							//xmlEnvio = xmlEnvio.replace(montolast, '0.00');
						}
					}
				}
			}

			var montoo_1001 = 0.00;
			var DiscRate  = parseFloat(xmlEnvio.split('*DISCRATE*')[1]);
			if (DiscRate != null && DiscRate != '' && DiscRate != 0.0 && !isNaN(DiscRate) ) {
				xmlEnvio = xmlEnvio.replace('*AXL*', "Entro a DiscRate");
				xmlEnvio = xmlEnvio.replace('*SLASH*', DiscRate);
				DiscRate   = Math.abs(DiscRate);
				monto_1001 = monto_1001 - monto_1001*DiscRate;
				monto_1002 = monto_1002 - monto_1002*DiscRate;
				monto_1003 = monto_1003 - monto_1003*DiscRate;
			}
			xmlEnvio = xmlEnvio.replace('*1001*', monto_1001);
			montoo_1001=monto_1001;
			monto_1001 = monto_1001.toFixed(2);
			monto_1002 = monto_1002.toFixed(2);
			monto_1003 = monto_1003.toFixed(2);
			monto_1004 = monto_1004.toFixed(2);
			/* Se reemplaza Totales de venta segun Tipo de IGV */
			xmlEnvio = xmlEnvio.replace('-MONTO1001-', monto_1001);
			xmlEnvio = xmlEnvio.replace('-MONTO1002-', monto_1002);
			xmlEnvio = xmlEnvio.replace('-MONTO1003-', monto_1003);
			xmlEnvio = xmlEnvio.replace('-MONTO1004-', monto_1004);
			reg = new RegExp('-MONTOLINEA-', "g");
			xmlEnvio = xmlEnvio.replace(reg, '');


            /***************************************************************************/
			/* Aplica descuento a cada sumatoria de montos por tipo de impuesto */
 			/* Detracciones Peru - Solo Factura y ND */
 			if(codDoc=='01' ){
 				var mensaje='';
	 			var monto_2003 = 0;
	 			var porcentaje_2003=0;
	 			var codigo_3000='';
	 			var numBanco_3001='';

	 			var detrac = xmlEnvio.split('-DETRA-')[1];
              	//if(AUTODETRA != null){
                  if(detrac != null && detrac !='SIN DETRACCIÓN'){
                      
                      var porcen = xmlEnvio.split('-PORCENTAJE-')[1];
                      var porcen_sub= parseFloat(porcen)*100;
                      porcen_sub=parseFloat(porcen_sub);
                      porcentaje_2003=porcen_sub;
					  var codDetra = detrac.substring(0,2);
					  codDetra = '0'+codDetra;

						  var montoDetra = xmlEnvio.split('-MONTODET-')[1];
                  		  var montoDetra_sub= parseFloat(montoDetra)/porcen_sub;
		                  montoDetra_sub=parseFloat(montoDetra_sub);
		                  montoDetra_sub=montoDetra_sub.toFixed(2);
                          mensaje=DETRACCION;
                          codigo_3000=codDetra;
                          numBanco_3001=NUMCUENTA;
                    
                     
                      var detra_ulti = '-DETRA-' + detrac + '-DETRA-';
                      var porce_ulti = '-PORCENTAJE-' + porcen + '-PORCENTAJE-';
                      var montoDetra_ulti = '-MONTODET-' + montoDetra + '-MONTODET-';
                  }
                  xmlEnvio = xmlEnvio.replace(detra_ulti, '');
                  xmlEnvio = xmlEnvio.replace(porce_ulti,porcentaje_2003);
                  xmlEnvio = xmlEnvio.replace(montoDetra_ulti,montoDetra_sub);
                  xmlEnvio = xmlEnvio.replace('-DETRACCION-', mensaje);
                  xmlEnvio = xmlEnvio.replace('-CODIGO3000-', codigo_3000);
                  xmlEnvio = xmlEnvio.replace('-NUMERO3001-', numBanco_3001);
              //  }else{
              	/*
                  var porcen = xmlEnvio.split('-PORCENTAJE-')[1];
                  var porcen_sub= parseFloat(porcen)*100;
                  porcen_sub=parseFloat(porcen_sub);
                  porcentaje_2003=porcen_sub;
                  var montoDetra = xmlEnvio.split('-MONTODET-')[1];
                  var montoDetra_sub= parseFloat(montoDetra)/10;
		          montoDetra_sub=parseFloat(montoDetra_sub);
                  mensaje=DETRACCION;
                  codigo_3000=CODIGODETRA;
                  numBanco_3001=NUMCUENTA;
                  var detra_ulti = '-DETRA-' + detrac + '-DETRA-';
                  var porce_ulti = '-PORCENTAJE-' + porcen + '-PORCENTAJE-';
                  var montoDetra_ulti = '-MONTODET-' + montoDetra + '-MONTODET-';
                  xmlEnvio = xmlEnvio.replace(detra_ulti, '');
                  xmlEnvio = xmlEnvio.replace(porce_ulti,porcentaje_2003);
                  xmlEnvio = xmlEnvio.replace(montoDetra_ulti,montoDetra_sub);
                  xmlEnvio = xmlEnvio.replace('-DETRACCION-', mensaje);
                  xmlEnvio = xmlEnvio.replace('-CODIGO3000-', codigo_3000);
                  xmlEnvio = xmlEnvio.replace('-NUMERO3001-', numBanco_3001);
                }
	 			*/

 			}
			//var returnAutCbtsSinc	= WSAutCbtsSinc(xmlEnvio);
			var returnAutCbtsAsinc	= WSAutCbtsAsinc(xmlEnvio);

			/* Tiempo de espera de respuesta de SUNAT */
			sleep(1900);

			var returnSalidaTransac = '';
			if(TransaccionId != ''){
				returnSalidaTransac = WSSalidaTransac();
			}

			var returnRespCbte = WSRespCbte();

			if (exito) {
                var returnDescargarPdf = WSDescargarPdf();
                                
                rec.setValue('custbody_lmry_pe_identificador_comfiar', TransaccionId);
                rec.setValue('custbody_lmry_pe_num_aut_comfiar', numAut);
                rec.setValue('custbody_lmry_num_preimpreso', secuencial);
                rec.setValue('custbody_lmry_pe_estado_comfiar', estado_comfiar);
                rec.save();

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
	      
		var TransacId = returnAutCbtsSinc.split('TransaccionId')[1];
		if(TransacId != null && TransacId != ''){
			TransaccionId = TransacId.substring(1, TransacId.length-2);
		}

		var SalidaTransaccion = returnAutCbtsSinc.split('Transaccion>')[1];
		if(SalidaTransaccion != null && SalidaTransaccion != ''){
			var ID = SalidaTransaccion.split('ID')[1];
			if(ID != null && ID != ''){
				TransaccionId = ID.substring(1, ID.length-2);
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
			}else if(estado == 'RECHAZADO'){
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
			}else {
				var estadoProceso = returnSalidaTransac.split('TransaccionSinTerminar>')[1];
				if (estadoProceso != null && estadoProceso != '') {
					exito = true;
					estado_comfiar = "PROCESANDO";
					var logRecord = record.create({type: 'customrecord_lmry_pe_fel_lote_envio'});
					logRecord.setValue('custrecord_lmry_pe_envio_subsi', runtime.getCurrentUser().subsidiary);
					logRecord.setValue('custrecord_lmry_pe_envio_user', runtime.getCurrentUser().id);
					logRecord.setValue('custrecord_lmry_pe_envio_transac', internalId);
					logRecord.setValue('custrecord_lmry_pe_envio_status', "PROCESANDO" + " - puntoDeVentaIdWS: " + puntoDeVentaIdWS);
					logRecord.setValue('custrecord_lmry_pe_envio_resp', estado);
					//logRecord.setValue('custrecord_lmry_pe_envio_resp', 'ERROR..');
					logRecord.setValue('custrecord_lmry_pe_envio_iden', codDoc);
					logRecord.save();
				}
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

		var body =  '<body text="#333333" link="#014684" vlink="#014684" alink="#014684">';
            body += '<table width="642" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" valign="top">';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td width="100%" colspan="2"><img style="display: block;" src="https://system.na1.netsuite.com/core/media/media.nl?id=921&c=TSTDRV1038915&h=c493217843d184e7f054" width="645" alt="main banner"/></td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">';
            body += '<tr>';
            body += '<td bgcolor="#d50303" width="15%">&nbsp;</td>';
            body += '<td bgcolor="#d50303" width="85%">';
            body += '<font style="color:#FFFFFF; line-height:130%; font-family:Arial, Helvetica, sans-serif; font-size:19px">';
            body += 'Estimado(a) ' + nameUser + ':<br>';
            body += '</font>';
            body += '</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#d50303" colspan="2" align="right"><a href="http://www.latamready.com/#contac"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=923&c=TSTDRV1038915&h=3c7406d759735a1e791d" width="94" style="margin-right:45px" /></a></td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="100%" bgcolor="#FFF" colspan="2" align="right">';
            body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=924&c=TSTDRV1038915&h=c135e74bcb8d5e1ac356" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=919&c=TSTDRV1038915&h=9c937774d04fb76747f7" width="15" style="margin:5px 1px 5px 0px" /></a>';
            body += '<a href="https://twitter.com/LatamReady"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=928&c=TSTDRV1038915&h=fc69b39a8e7210c65984" width="15" style="margin:5px 47px 5px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:13px">';            
            if (codDoc == '01') {
                if (exito) {
                    body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se ha generado la Factura Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b> y estado <b>' + estado_comfiar + '</b>.</p>';
                }else{
                    body += '<p>Este es un mensaje de error automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se produjo un error al emitir la Factura Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b>.</p>';
                    body += '<p>Por favor, comunícate con nuestro departamento de Servicio al Cliente a: customer.care@latamready.com</p>';
                    body += '<p>Nosotros nos encargamos.</p>';
                }
            }else if (codDoc == '03') {
                if (exito) {
                    body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se ha generado la Boleta de Venta Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b> y estado <b>' + estado_comfiar + '</b>.</p>';
                }else{
                    body += '<p>Este es un mensaje de error automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se produjo un error al emitir la Boleta de Venta Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b>.</p>';
                    body += '<p>Por favor, comunícate con nuestro departamento de Servicio al Cliente a: customer.care@latamready.com</p>';
                    body += '<p>Nosotros nos encargamos.</p>';
                }
            }else if (codDoc == '08') {
                if (exito) {
                    body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se ha generado la Nota de Débito Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b> y estado <b>' + estado_comfiar + '</b>.</p>';
                }else{
                    body += '<p>Este es un mensaje de error automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se produjo un error al emitir la Nota de Débito Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b>.</p>';
                    body += '<p>Por favor, comunícate con nuestro departamento de Servicio al Cliente a: customer.care@latamready.com</p>';
                    body += '<p>Nosotros nos encargamos.</p>';
                }
            }
            body += '<p>Saludos,</p>';
            body += '<p>El Equipo de LatamReady</p>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<br>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2" bgcolor="#e5e6e7">';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<font style="color:#333333;line-height:200%; font-family:Trebuchet MS, Helvetica, sans-serif; font-size:12px;" >';
            body += '<i>Este es un mensaje automático. Por favor, no responda este correo electrónico.</i>';
            body += '</font>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '<tr>';
            body += '<td>&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="http://www.latamready.com/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=926&c=TSTDRV1038915&h=e14f0c301f279780eb38" width="169" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0" cellpadding="2">';
            body += '<tr>';
            body += '<td width="15%">&nbsp;</td>';
            body += '<td width="70%" align="center">';
            body += '<a href="https://www.linkedin.com/company/9207808"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=925&c=TSTDRV1038915&h=41ec53b63dba135488be" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="https://www.facebook.com/LatamReady-337412836443120/"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=920&c=TSTDRV1038915&h=7fb4d03fff9283e55318" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '<a href="https://twitter.com/LatamReady"><img src="https://system.na1.netsuite.com/core/media/media.nl?id=929&c=TSTDRV1038915&h=300c376863035d25c42a" width="101" style="margin:0px 5px 0px 5px" /></a>';
            body += '</td>';
            body += '<td width="15%">&nbsp;</td>';
            body += '</tr>';
            body += '</table>';
            body += '<table width="100%" border="0" cellspacing="0">';
            body += '<tr>';
            body += '<td>';
            body += '<img src="https://system.na1.netsuite.com/core/media/media.nl?id=918&c=TSTDRV1038915&h=7f0198f888bdbb495497" width="642" style="margin:15px 0px 15px 0px" /></a>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</td>';
            body += '</tr>';
            body += '</table>';
            body += '</body>';
		
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
		var subject = '';
		if (codDoc == '01') {
        	if (exito) {
            	subject = "LatamReady - Factura Electrónica PE " + tranID + ": " + estado_comfiar;
        	}else{
        		subject = "LatamReady - Factura Electrónica PE " + tranID + ": ERROR";
        	}
        }else if (codDoc == '03') {
        	if (exito) {
            	subject = "LatamReady - Boleta de Venta Electrónica PE: " + tranID + ": " + estado_comfiar;
        	}else{
        		subject = "LatamReady - Boleta de Venta Electrónica PE " + tranID + ": ERROR";
        	}            
        }else if (codDoc == '08') {
        	if (exito) {
            	subject = "LatamReady - Nota de Débito Electrónica PE: " + tranID + ": " + estado_comfiar;
        	}else{
        		subject = "LatamReady - Nota de Débito Electrónica PE " + tranID + ": ERROR";
        	}
        }
		//'manuel@latamready.com'
		email.send({
            author: currentuser,
            recipients: emailUser,
            //recipients: ['manuel@latamready.com'],
            //cc: 'manuel@latamready.com',
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

	function convertirNumero(num){
		var arr = num.split(".");  // declaro el array  
		

			var number= arr[0]; 
			var decimal = arr[1]; 
			
			var numero = parseInt(number);
			
			var arrayp = new Array();

			for(var i=0; numero>10; i++){
			   arrayp[i]=""+numero%10;				   
			   numero = parseInt(numero/10);				   
			}				
			arrayp[i]=numero;				
			var nuevonum="."+decimal;				
			for(var j=0;j<arrayp.length;j++){
				if(j==3 || j==6 || j ==9 || j==12){
					nuevonum=","+nuevonum;
				}
			   nuevonum=arrayp[j] + nuevonum;			   
			}
			return nuevonum;
		
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