package org.meb.oneringdb.deck.helper;

public class DeckHelperFactory {

	private DeckHelperFactory() {

	}

	public static DeckHelper buildDeckHelper() {
		return new RegularDeckHelper();
	}
}
