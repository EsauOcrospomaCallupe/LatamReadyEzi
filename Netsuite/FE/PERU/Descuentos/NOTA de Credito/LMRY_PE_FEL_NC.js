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
	var FORMATO_WS  = '';

	var SesionId         = '';
	var FechaVencimiento = '';
	var cuitId           = '';
	var puntoDeVentaId   = '';
	var puntoDeVentaIdWS = '';
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
					type: record.Type.CREDIT_MEMO,
					id: plugInContext.transaction.id
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

			/* Se da formato a fecha de emisión */
			var fechaEmision = xmlEnvio.split('cbc:IssueDate>')[1];
			if(fechaEmision != null && fechaEmision != ''){
				fechaEmision = fechaEmision.substring(0, fechaEmision.length-2);
				fecha_temp 	 = fechaEmision;
				fechaEmision = FormatoDDMMYYY(fechaEmision);
				xmlEnvio = xmlEnvio.replace(fecha_temp, fechaEmision);
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

            var inv_lines = new Array();
            ind = 0;

            var subsi    = rec.getValue('subsidiary');
            /* Registro Personalizado LatamReady - Items Dscto Related
				Item      = resultItemDesc[i].getValue(row[0]);
				Desc      = resultItemDesc[i].getValue(row[1]);
				Multiplo  = resultItemDesc[i].getValue(row[2]);
				Promocion = resultItemDesc[i].getValue(row[3]);
			*/
        	busqItemDesc = search.create({
	            type: 'customrecord_lmry_item_dscto_relacionado',
	            columns: ['custrecord_lmry_related_item', 'custrecord_lmry_related_dscto',
	            		'custrecord_lmry_related_multiplo', 'custrecord_lmry_related_promocion' ],
	            filters: [ ['custrecord_lmry_related_subsidiary', 'anyof', subsi] ]
	        });
	        resultItemDesc = busqItemDesc.run().getRange(0, 100);

            numLines = rec.getLineCount({
			    sublistId: 'item'
			});

			for (var i = 0; i < numLines-1; i++) {
				item_actual = rec.getSublistValue('item', 'item', i);
				type_actual = rec.getSublistValue('item', 'itemtype', i);
				item_sig    = rec.getSublistValue('item', 'item', i+1);

				if(resultItemDesc != null && resultItemDesc.length != 0){
		        	for (var j = 0; j < resultItemDesc.length; j++) {
		        		row  = resultItemDesc[j].columns;
		        		if (item_actual == resultItemDesc[j].getValue(row[0]) && item_sig == resultItemDesc[j].getValue(row[1]) && type_actual != "Discount") {
							inv_lines[ind] = new Array();
							/* Linea InvLine */
							inv_lines[ind][0] = i;
							/* Multiplo */
							inv_lines[ind][1] = resultItemDesc[j].getValue(row[2]);
							/* Promocion */
							inv_lines[ind][2] = resultItemDesc[j].getValue(row[3]);
							/* Price Level */
							inv_lines[ind][3] = rec.getSublistValue('item', 'price_display', i);
							/* Cantidad */
							inv_lines[ind][4] = rec.getSublistValue('item', 'quantity', i);

							ind++;
			            }
		        	}
		        }

			}
			
			var InvoiceLine  = xmlEnvio.split('cac:InvoiceLine');
            for (i=0; i<inv_lines.length; i++){
				//var InvoiceLine  = xmlEnvio.split('cac:InvoiceLine');
				var num_linea = 0;
				for (var j = 1; j < InvoiceLine.length; j=j+2) {

					if(InvoiceLine[j] != null && InvoiceLine[j] != ''){
						InvoiceLine_temp = InvoiceLine[j];

						if (inv_lines[i][0] == num_linea) {
							/* Multiplo */
							var multiplo = inv_lines[i][1];
							/* Promocion */
							var promo = inv_lines[i][2];
							/* Price Level */
							var pricelevel = inv_lines[i][3];
							/* Cantidad */
							var cantidad = inv_lines[i][4];

							var cant_bono = parseInt(cantidad/multiplo)*promo;
							var cant_real = cantidad - cant_bono;
							var multiplicador = cant_real/cantidad;

							var cant = InvoiceLine_temp.split('-QTY-')[1];
							if(cant != null && cant != ''){
								var cant_last = '-QTY-' + cant + '-QTY-';
								var cant_new  = cant_real;
								xmlEnvio = xmlEnvio.replace(cant_last, cant_new);
							}
							/***********************************************************/
							
							var cant_sig = InvoiceLine[j+2].split('-QTY-')[1];
							if(cant_sig != null && cant_sig != ''){
								var cantsig_last = '-QTY-' + cant_sig + '-QTY-';
								var cantsig_new  = cant_bono;
								//var cantsig_new  = '-QTY-' + cant_bono + '-QTY-';
								xmlEnvio = xmlEnvio.replace(cantsig_last, cantsig_new);
							}
							var montodesc = InvoiceLine[j+2].split('-MONTODESC-')[1];
							if(montodesc != null && montodesc != ''){
								var montodesc_last = '-MONTODESC-' + montodesc + '-MONTODESC-';
								var montodesc_new  = montodesc/cant_bono;
								//var montodesc_new  = '-MONTODESC-' + montodesc/cant_bono + '-MONTODESC-';
                              montodesc_new = montodesc_new.toFixed(2);
								xmlEnvio = xmlEnvio.replace(montodesc_last, montodesc_new);
								xmlEnvio = xmlEnvio.replace(montodesc_last, montodesc_new);
							}
							
							/***********************************************************/

							var tax_amount = InvoiceLine_temp.split('-TAXAMOUNT-')[1];
							if(tax_amount != null && tax_amount != ''){
								var taxamount_last = '-TAXAMOUNT-' + tax_amount + '-TAXAMOUNT-';
								var taxamount_new  = tax_amount*multiplicador;
                                taxamount_new = taxamount_new.toFixed(2);
								xmlEnvio = xmlEnvio.replace(taxamount_last, taxamount_new);
								xmlEnvio = xmlEnvio.replace(taxamount_last, taxamount_new);
							}

							var monto = parseFloat(InvoiceLine_temp.split('-MONTO-')[1]);
							if(monto != null && monto != ''){
								var monto_last = '-MONTO-' + monto + '-MONTO-';
								var monto_new  = monto*multiplicador;
                              monto_new = monto_new.toFixed(2);
								xmlEnvio = xmlEnvio.replace(monto_last, monto_new);
							}

						}else{
							/*
							if (InvoiceLine_temp.indexOf("*ESDESC*") != -1) {
								log.debug("SI Entro -1", "SI Entro -1 i: " +i+ " - j: " + j + " - num_linea: " + num_linea);
								xmlEnvio = xmlEnvio.replace('-QTY-', '');xmlEnvio = xmlEnvio.replace('-QTY-', '');
							}*/
							/*
							xmlEnvio = xmlEnvio.replace('-QTY-', '');xmlEnvio = xmlEnvio.replace('-QTY-', '');
							xmlEnvio = xmlEnvio.replace('-TAXAMOUNT-', '');xmlEnvio = xmlEnvio.replace('-TAXAMOUNT-', '');
							xmlEnvio = xmlEnvio.replace('-TAXAMOUNT-', '');xmlEnvio = xmlEnvio.replace('-TAXAMOUNT-', '');
							xmlEnvio = xmlEnvio.replace('-MONTO-', '');xmlEnvio = xmlEnvio.replace('-MONTO-', '');
							*/
						}

						num_linea++;

					}
				}
			}

			reg = new RegExp('-QTY-', "g");
			xmlEnvio = xmlEnvio.replace(reg, '');
			reg = new RegExp('-TAXAMOUNT-', "g");
			xmlEnvio = xmlEnvio.replace(reg, '');
			reg = new RegExp('-MONTO-', "g");
			xmlEnvio = xmlEnvio.replace(reg, '');
            
	        /***************************************************************************/

			/*Generacion Sumatorias Montos por Impuesto*/
			/*Para MONTOLINEA : "Total valor de venta - operaciones gravadas" - Cod 10 "Gravado - Operación Onerosa". */
			var monto_1001 = 0.00;
			/*Para MONTOLINEA : "Total valor de venta - operaciones inafectas" - Cod 40 "Exportación". */ 
			var monto_1002 = 0.00; 
			/*Para MONTOLINEA : "Total valor de venta - operaciones exoneradas" - Cod 20 "Exonerado - "Operación Onerosa". */
			var monto_1003 = 0.00; 
			/*Para MONTOLINEA : "Total valor de venta – Operaciones gratuitas"
				- Cod 31 "Inafecto – Retiro por Bonificación".
				- Cod 32 "Inafecto – Retiro". 
			*/
			var monto_1004 = 0.00;
			var MONTOLINEA = 0.00;
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
						}else if (CodTipoAfecto == '20') {
							monto_1003    = monto_1003 + parseFloat(MONTOLINEA);
						}else if (CodTipoAfecto == '31' || CodTipoAfecto == '32') {
							monto_1004    = monto_1004 + parseFloat(MONTOLINEA);
						}
					}
				}
			}

			/* Se reemplaza Totales de venta segun Tipo de IGV pero sin descuentos en TextosLibres 15, 16 y 17 */
			xmlEnvio = xmlEnvio.replace('-1001-', monto_1001.toFixed(2));
			xmlEnvio = xmlEnvio.replace('-1002-', monto_1002.toFixed(2));
			xmlEnvio = xmlEnvio.replace('-1003-', monto_1003.toFixed(2));

			/* Aplica descuento a cada sumatoria de montos por tipo de impuesto */
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

			var returnAutCbtsAsinc	= WSAutCbtsAsinc(xmlEnvio);

			/* Tiempo de espera de respuesta de SUNAT */
			sleep(1900);

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
            //if (codDoc == '07') {
                if (exito) {
                    body += '<p>Este es un mensaje automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se ha generado la Nota de Credito Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b> y estado <b>' + estado_comfiar + '</b>.</p>';
                }else{
                    body += '<p>Este es un mensaje de error automático de LatamReady SuiteApp.</p>';
                    body += '<p>Se produjo un error al emitir la Nota de Crédito Electrónica <b>' + tranID + '</b> con Internal ID <b>' + internalId + '</b>.</p>';
                    body += '<p>Por favor, comunícate con nuestro departamento de Servicio al Cliente a: customer.care@latamready.com</p>';
                    body += '<p>Nosotros nos encargamos.</p>';
                }
            //}
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

		var subject = "";
		if (exito) {
        	subject = "LatamReady - Nota de Crédito Electrónica PE " + tranID + ": " + estado_comfiar;
    	}else{
    		subject = "LatamReady - Nota de Crédito Electrónica PE " + tranID + ": ERROR";
    	}
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