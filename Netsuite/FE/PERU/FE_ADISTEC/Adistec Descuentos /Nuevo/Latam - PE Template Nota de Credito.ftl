<#setting locale="en_US">
<#setting number_format="#.##">
<#assign contador = 0>
<#assign currency = transaction.currency.symbol>
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
						<cbc:ID>1001</cbc:ID> <!-- Valor de venta por ítem-->
						<cbc:PayableAmount currencyID="${currency}">-MONTO1001-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1002</cbc:ID>
						<cbc:PayableAmount currencyID="${currency}">-MONTO1002-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalMonetaryTotal>
						<cbc:ID>1003</cbc:ID> <!-- Valor de venta por ítem-->
						<cbc:PayableAmount currencyID="${currency}">-MONTO1003-</cbc:PayableAmount>
					</sac:AdditionalMonetaryTotal>
					<sac:AdditionalProperty>
						<cbc:ID>1000</cbc:ID>
						<cbc:Value>${transaction.custbody_monto_letras_pa}</cbc:Value>
					</sac:AdditionalProperty>
				</sac:AdditionalInformation>
			</ext:ExtensionContent>
		</ext:UBLExtension>
		<ext:UBLExtension>
		</ext:UBLExtension>
	</ext:UBLExtensions>
	<cbc:UBLVersionID>2.0</cbc:UBLVersionID>
	<cbc:CustomizationID>1.0</cbc:CustomizationID>
	<cbc:ID>-NUMERACION-${transaction.custbody_lmry_serie_doc_cxc}-${transaction.custbody_lmry_num_preimpreso}-NUMERACION-</cbc:ID>
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
	<cac:TaxTotal> <!-- 1000 - IGV - VAT Identifican el total de IGV de la factura -->
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
		<!--IMPORTE TOTAL-->
		<cbc:PayableAmount currencyID="${currency}">${transaction.total?c?number?string["#.##"]}</cbc:PayableAmount>
	</cac:LegalMonetaryTotal>
	<#list transaction.item as item>
	<cac:CreditNoteLine>		
		<#assign contador = contador+1>
		<cbc:ID>${contador}</cbc:ID>
		<!-- Es la cantidad de items que se compro = Q -->
		<cbc:CreditedQuantity unitCode="NIU">${item.quantity?c?number?string["#.###"]}</cbc:CreditedQuantity>
		<!-- Es el valor de venta por item = Valor de Venta Bruto - Descuento -->
		<cbc:LineExtensionAmount currencyID="${currency}">-MONTOLINEA-${item.amount?c?number?string["#.##"]}-MONTOLINEA-</cbc:LineExtensionAmount>
		<cac:PricingReference>
			<cac:AlternativeConditionPrice>
				<#assign precUnit = item.rate + item.rate*item.taxrate1?c?number>
				<!-- ${precUnit} -->
				<cbc:PriceAmount currencyID="${currency}">${precUnit?c?number?string["#.##"]}</cbc:PriceAmount>
				<cbc:PriceTypeCode>01</cbc:PriceTypeCode>
			</cac:AlternativeConditionPrice>
		</cac:PricingReference>
		<!-- TAXRATE : ${item.taxrate1} - ${item.taxrate1?c?number} -->
		<cac:TaxTotal> 
		     <!-- IGV Total de ese Item --> 
			<cbc:TaxAmount currencyID="${currency}">${item.tax1amt?c?number?string["#.##"]}</cbc:TaxAmount>
			<cac:TaxSubtotal>
				<cbc:TaxAmount currencyID="${currency}">${item.tax1amt?c?number?string["#.##"]}</cbc:TaxAmount>
				<cac:TaxCategory>
					<cbc:TaxExemptionReasonCode>-COD-${item.taxcode}-COD-</cbc:TaxExemptionReasonCode>
					<!-- IGV gravado operacion ONEROSA -->
					<cac:TaxScheme>
						<cbc:ID>1000</cbc:ID>
						<cbc:Name>IGV</cbc:Name>
						<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
					</cac:TaxScheme>
				</cac:TaxCategory>
			</cac:TaxSubtotal>
		</cac:TaxTotal>
		<cac:Item>
		 	<!-- DESCRIPCION --> 
			<cbc:Description>${item.description}</cbc:Description>
			<cac:SellersItemIdentification>
			<!-- CODIGO DE ITEM --> 
				<cbc:ID>${item.item}</cbc:ID>
			</cac:SellersItemIdentification>
		</cac:Item>
		<cac:Price>
		     <!-- VAlor unitario por item -->  
			<cbc:PriceAmount currencyID="${currency}">${item.rate?c?number?string["#.##"]}</cbc:PriceAmount>
		</cac:Price>		
	</cac:CreditNoteLine>
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
</TextosLibres>
</informacionOrganismo>
</Comprobante>
</Comprobantes>