package org.meb.oneringdb.web.json.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class JsonDomainExt {

	private String techName;
	private String name;
	private String nameEn;
	private String shortName;

	public JsonDomainExt(String techName, String name, String shortName) {
		this.techName = techName;
		this.name = name;
		this.shortName = shortName;
	}
	
	public JsonDomainExt(String techName, String name, String nameEn, String shortName) {
		this.techName = techName;
		this.name = name;
		this.nameEn = nameEn;
		this.shortName = shortName;
	}
}
