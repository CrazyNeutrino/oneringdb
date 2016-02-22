package org.meb.oneringdb.db.converter;

import javax.persistence.AttributeConverter;

import org.apache.commons.lang3.StringUtils;
import org.meb.oneringdb.db.model.Sphere;

public class SphereConverter implements AttributeConverter<Sphere, String> {

	@Override
	public String convertToDatabaseColumn(Sphere arg0) {
		if (arg0 == null) {
			return null;
		}
		return arg0.toString().replace('_', '-').toLowerCase();
	}

	@Override
	public Sphere convertToEntityAttribute(String arg0) {
		arg0 = StringUtils.trimToNull(arg0);
		if (arg0 == null) {
			return null;
		}
		return Sphere.valueOf(arg0.replace('-', '_').toUpperCase());
	}
}