package org.meb.oneringdb.service;

import javax.enterprise.context.RequestScoped;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@RequestScoped
public class QueryContext {

	private String userLanguage;
	private Long userId;
}
