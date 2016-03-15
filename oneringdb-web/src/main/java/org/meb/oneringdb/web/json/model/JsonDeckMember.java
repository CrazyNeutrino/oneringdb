package org.meb.oneringdb.web.json.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.meb.oneringdb.db.model.DeckMember;

@Getter
@Setter
@NoArgsConstructor
public class JsonDeckMember {

	private Long cardId;
	private Integer quantity;
	private Integer sequence;

	public JsonDeckMember(Long cardId, Integer quantity, Integer sequence) {
		this.cardId = cardId;
		this.quantity = quantity;
		this.sequence = sequence;
	}

	public JsonDeckMember(DeckMember deckMember) {
		this.cardId = deckMember.getCard().getId();
		this.quantity = deckMember.getQuantity();
		this.sequence = deckMember.getSequence();
	}
}
