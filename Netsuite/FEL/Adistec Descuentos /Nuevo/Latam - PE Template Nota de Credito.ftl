<#setting locale    = "en_US">
<#assign cont       = 1>
<#assign currency   = transaction.currency.symbol>
<#assign descGlobal = transaction.discounttotal*-1?c?number>
<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>
<Comprobantes>
<Comprobante>
<informacionOrganismo>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ccts="urn:un:unece:uncefact:documentation:2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<ext:UBLExtensions>
		<ext:UBLExtension>
			<ext:ExtensionContent>
				<sac:AdditionalInformation>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1001</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1001-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1002</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1002-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1003</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1003-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<!-- DISCOUNTTOTAL : ${transaction.discounttotal} - DISCOUNTRATE : ${transaction.discountrate} - *DISCRATE*${transaction.discountrate?c}*DISCRATE* - ${transaction.discountrate?c?number?string["#.###"]} - ${transaction.discountrate?c}-->
					
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>2005</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO2005-${descGlobal?string["#.##"]}-MONTO2005-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					
					<sac:AdditionalProperty>
						<cbc:ID>1000</cbc:ID>
						<cbc:Value>${transaction.custbody_monto_letras_pa}</cbc:Value>
					</sac:AdditionalProperty>
				</sac:AdditionalInformation>
			</ext:ExtensionContent>
		</ext:UBLExtension>
	</ext:UBLExtensions>
	<cbc:UBLVersionID>2.0</cbc:UBLVersionID>
	<cbc:CustomizationID>1.0</cbc:CustomizationID>
	<cbc:ID>-NUMERACION-${transaction.custbody_lmry_serie_doc_cxc + "-" + transaction.custbody_lmry_num_preimpreso}-NUMERACION-</cbc:ID>
	<cbc:IssueDate>${transaction.trandate}</cbc:IssueDate>
	<cbc:DocumentCurrencyCode>${currency}-TIPODOC-${transaction.custbody_lmry_document_type.custrecord_lmry_codigo_doc}-TIPODOC-</cbc:DocumentCurrencyCode>
	<cac:DiscrepancyResponse>
		<!-- Serie y número del documento que modifica -->
		<cbc:ReferenceID>${transaction.custbody_lmry_doc_serie_ref}-${transaction.custbody_lmry_num_doc_ref}</cbc:ReferenceID>
		<!-- Codigo de devolución 07-Devolución parcial -->
		<cbc:ResponseCode>${transaction.custbody_lmry_modification_reason.custrecord_lmry_cod_modification_reason}</cbc:ResponseCode>
		<!-- Motivos devolución -->
		<cbc:Description>${transaction.message}</cbc:Description>
	</cac:DiscrepancyResponse>
	<cac:BillingReference>
		<cac:InvoiceDocumentReference>
		    <!-- Serie y número del documento que modifica -->
			<cbc:ID>${transaction.custbody_lmry_doc_serie_ref}-${transaction.custbody_lmry_num_doc_ref}</cbc:ID>
			<!--Tipo de documento del documento que modifica-->
			<cbc:DocumentTypeCode>${transaction.custbody_doc_ref_type.custrecord_lmry_codigo_doc}</cbc:DocumentTypeCode> 
		</cac:InvoiceDocumentReference>
	</cac:BillingReference>
	<cac:AccountingSupplierParty>
		<cbc:CustomerAssignedAccountID>${transaction.subsidiary.taxidnum}</cbc:CustomerAssignedAccountID>
		<cbc:AdditionalAccountID>${transaction.subsidiary.custrecord_tipo_doc_id_sunat_id}</cbc:AdditionalAccountID>
		<cac:Party>
			<cac:PartyName>
				<cbc:Name>${transaction.subsidiary.legalname}</cbc:Name>
			</cac:PartyName>
			<cac:PostalAddress>
				<cbc:ID></cbc:ID>
				<cbc:StreetName>${transaction.subsidiary.address1}</cbc:StreetName>
				<cbc:CitySubdivisionName>LIMA</cbc:CitySubdivisionName>
				<cbc:CityName>${transaction.subsidiary.city}</cbc:CityName>
				<cbc:CountrySubentity>${transaction.subsidiary.state}</cbc:CountrySubentity>
				<cbc:District>${transaction.subsidiary.address2}</cbc:District>
				<cac:Country>
					<cbc:IdentificationCode>PE</cbc:IdentificationCode>
				</cac:Country>
			</cac:PostalAddress>
			<cac:PartyLegalEntity>
				<cbc:RegistrationName>${transaction.subsidiary.legalname}</cbc:RegistrationName>
			</cac:PartyLegalEntity>
		</cac:Party>
	</cac:AccountingSupplierParty>
	<cac:AccountingCustomerParty>
		<cbc:CustomerAssignedAccountID>${customer.vatregnumber}</cbc:CustomerAssignedAccountID>
		<cbc:AdditionalAccountID>${customer.custentity_cod_tipo_doc_id_sunat}</cbc:AdditionalAccountID>
		<cac:Party>
			<cac:PartyLegalEntity>
				<cbc:RegistrationName>${customer.companyname}</cbc:RegistrationName>
			</cac:PartyLegalEntity>
		</cac:Party>
	</cac:AccountingCustomerParty>
	<cac:TaxTotal>
		<cbc:TaxAmount currencyID="${currency}">${transaction.taxtotal?c?number?string["#.##"]}</cbc:TaxAmount>
		<cac:TaxSubtotal>
			<cbc:TaxAmount currencyID="${currency}">${transaction.taxtotal?c?number?string["#.##"]}</cbc:TaxAmount>
			<cac:TaxCategory>
				<cac:TaxScheme>
					<cbc:ID>1000</cbc:ID>
					<cbc:Name>IGV</cbc:Name>
				</cac:TaxScheme>
			</cac:TaxCategory>
		</cac:TaxSubtotal>
	</cac:TaxTotal>
	<cac:LegalMonetaryTotal>
		<cbc:PayableAmount currencyID="${currency}">${transaction.total?c?number?string["#.##"]}</cbc:PayableAmount>
		<#if transaction.discounttotal != 0>
		<cbc:AllowanceTotalAmount currencyID="${currency}">${descGlobal?string["#.##"]}</cbc:AllowanceTotalAmount>
		</#if>
	</cac:LegalMonetaryTotal>
	<#list transaction.item as item>
	<#if item.amount \gt 0>
	<cac:CreditNoteLine>
		<cbc:ID>${cont}</cbc:ID>
		<#assign cont = cont + 1>
		<cbc:CreditedQuantity unitCode="${item.units}">-QTY-${item.quantity?c?number?string["#.###"]}-QTY-</cbc:CreditedQuantity>
		<!-- Es el valor de venta por item = Valor de Venta Bruto - Descuento -->
		<cbc:LineExtensionAmount currencyID="${currency}">-MONTOLINEA--MONTO-${item.amount?c?number?string["#.##"]}-MONTO--MONTOLINEA-</cbc:LineExtensionAmount>
		<cac:PricingReference>
			<cac:AlternativeConditionPrice>
				<#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
				<!-- ${precUnit} - Unidad Medida: ${item.units}  -->
				<cbc:PriceAmount currencyID="${currency}">${precUnit?c?number?string["#.##"]}</cbc:PriceAmount>
				<cbc:PriceTypeCode>01</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
		</cac:PricingReference>
		<!-- ITEMTAXRATE : ${item.taxrate1} - ${item.taxrate1?c?number} -->
		<cac:TaxTotal>
			<cbc:TaxAmount currencyID="${currency}">-TAXAMOUNT-${item.tax1amt?c?number?string["#.##"]}-TAXAMOUNT-</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxAmount currencyID="${currency}">-TAXAMOUNT-${item.tax1amt?c?number?string["#.##"]}-TAXAMOUNT-</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:TaxExemptionReasonCode>-COD-${item.taxcode}-COD-</cbc:TaxExemptionReasonCode>
					<cac:TaxScheme>
						<cbc:ID>1000</cbc:ID>
						<cbc:Name>IGV</cbc:Name>
						<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>
		<cac:Item>
			<cbc:Description>${item.custcol4} ${item.description}</cbc:Description>
			<cac:SellersItemIdentification>
				<cbc:ID>${item.price}</cbc:ID>
			</cac:SellersItemIdentification>
		</cac:Item>
		<cac:Price>
			<cbc:PriceAmount currencyID="${currency}">${item.rate?c?number?string["#.##"]}</cbc:PriceAmount>
		</cac:Price>
	</cac:CreditNoteLine>	
	<#elseif item.amount \lt 0>
	<cac:CreditNoteLine>
		 <!-- *ESDESC* -->
		<cbc:ID>${cont}</cbc:ID>
		<#assign cont = cont + 1>
		<cbc:CreditedQuantity unitCode="${item.units}">-QTY-1-QTY-</cbc:CreditedQuantity>
		<!-- Es el valor de venta por item = Valor de Venta Bruto - Descuento -->
		<#assign montoDesc = item.amount*-1?c?number>
		<cbc:LineExtensionAmount currencyID="${currency}">0.00</cbc:LineExtensionAmount>
		<cac:PricingReference>
			<cac:AlternativeConditionPrice>
				<!-- ${precUnit} - Unidad Medida: ${item.units}  -->
				<cbc:PriceAmount currencyID="${currency}">0.00</cbc:PriceAmount>
				<cbc:PriceTypeCode>01</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
			<cac:AlternativeConditionPrice>
                <#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
                <!-- ${precUnit} - Unidad Medida: ${item.units} -->
                <cbc:PriceAmount currencyID="${currency}">-MONTODESC-${montoDesc?string["#.##"]}-MONTODESC-</cbc:PriceAmount>
                <cbc:PriceTypeCode>02</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
		</cac:PricingReference>

		<cac:AllowanceCharge>
		 	<cbc:ChargeIndicator> false </cbc:ChargeIndicator >
		 	<cbc:Amount currencyID="${currency}">-MONTODESC-${montoDesc?string["#.##"]}-MONTODESC-</cbc:Amount>

		</cac:AllowanceCharge>
		 <!-- *AXL*  -  *1001*  -  *SLASH* -->
	     <!-- ITEMTAXRATE : ${item.taxrate1} - ${item.taxrate1?c?number} -->
		<cac:TaxTotal>
			<cbc:TaxAmount currencyID="${currency}">0</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxAmount currencyID="${currency}">0</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:TaxExemptionReasonCode>31</cbc:TaxExemptionReasonCode>
					<cac:TaxScheme>
						<cbc:ID>1000</cbc:ID>
						<cbc:Name>IGV</cbc:Name>
						<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>
		<cac:Item>
			<cbc:Description>${item.custcol4} ${item.description}</cbc:Description>
			<cac:SellersItemIdentification>
				<cbc:ID>${item.price}</cbc:ID>
			</cac:SellersItemIdentification>
		</cac:Item>
		<cac:Price>
			<cbc:PriceAmount currencyID="${currency}">-MONTODESC-${montoDesc?string["#.##"]}-MONTODESC-</cbc:PriceAmount>
		</cac:Price>

	</cac:CreditNoteLine>
	</#if>
	</#list>
</CreditNote>
<TextosLibres>
	<TextoLibre1>${transaction.otherrefnum}</TextoLibre1>
	<TextoLibre2>${transaction.billaddress}</TextoLibre2>
	<TextoLibre3>${transaction.terms}</TextoLibre3>
	<TextoLibre4>${customer.entityid}</TextoLibre4>
	<TextoLibre5>${transaction.custbody_lmry_doc_ref_date}</TextoLibre5>
	<TextoLibre6>${transaction.memo}</TextoLibre6>
	<TextoLibre7>${transaction.duedate}</TextoLibre7>
	<TextoLibre8>${transaction.currency}</TextoLibre8>
	<TextoLibre9>${transaction.salesrep}</TextoLibre9>
	<TextoLibre10>-2005-</TextoLibre10>
	<TextoLibre11>-1001-</TextoLibre11>
	<TextoLibre12>-1002-</TextoLibre12>
	<TextoLibre13>-1003-</TextoLibre13>
</TextosLibres>
</informacionOrganismo>
</Comprobante>
</Comprobantes>