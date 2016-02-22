package org.meb.oneringdb.db.model;

import java.util.Map;

public interface IBase<L extends ILang<?>> {

	Map<String, L> getLangItems();

	void setLangItems(Map<String, L> langItems);
}
