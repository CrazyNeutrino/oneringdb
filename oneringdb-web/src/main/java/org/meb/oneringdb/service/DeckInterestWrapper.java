package org.meb.oneringdb.service;

import org.meb.oneringdb.db.model.DeckInterest;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DeckInterestWrapper {

	private DeckInterest userDeckInterest;
	private DeckInterest totalDeckInterest;

	public DeckInterestWrapper(DeckInterest userDeckInterest, DeckInterest totalDeckInterest) {
		super();
		this.userDeckInterest = userDeckInterest;
		this.totalDeckInterest = totalDeckInterest;
	}
}
